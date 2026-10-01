package com.taxmeai.app;

import android.app.Notification;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;

import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Watches for notifications from the banking apps in {@link #BANK_PACKAGES}
 * and parses out completed payments/transfers, in either direction ("you
 * spent RM12.34 at ..." as an expense, "you received RM50.00 from ..." as
 * income), so they can be turned into an entry without the user retyping the
 * amount. Every other notification — from any other app, and non-transaction
 * notifications from the banking apps themselves (balance alerts, OTPs,
 * marketing) — is read by the OS but never inspected, stored, or forwarded by
 * this service.
 */
public class BankNotificationListenerService extends NotificationListenerService {

    // Verified against each bank's current Google Play Store listing. A bank
    // shipping a new app (as Public Bank and CIMB have both done recently)
    // means adding its new package name here.
    private static final Map<String, String> BANK_PACKAGES = new HashMap<>();
    static {
        BANK_PACKAGES.put("com.maybank2u.life", "Maybank");
        BANK_PACKAGES.put("com.cimb.cimbocto", "CIMB");
        BANK_PACKAGES.put("com.pbb.mypb", "Public Bank");
        BANK_PACKAGES.put("com.engage.pbb.pbengage2my.release", "Public Bank");
        BANK_PACKAGES.put("com.rhbgroup.rhbmobilebanking", "RHB");
    }

    // "RM12.34", "RM 1,234.56", "RM12" — the amount spent.
    private static final Pattern AMOUNT_PATTERN =
        Pattern.compile("RM\\s?([0-9][0-9,]*(?:\\.[0-9]{1,2})?)", Pattern.CASE_INSENSITIVE);

    // Best-effort merchant/counterparty extraction: the word(s) following a
    // preposition that typically introduces who the money moved to or from,
    // in both English and Bahasa Melayu bank wording. Deliberately generic
    // rather than bank-specific, since exact wording varies by bank and
    // changes with app updates.
    private static final Pattern MERCHANT_PATTERN = Pattern.compile(
        "(?:to|at|from|kepada|di|dari)\\s+([A-Za-z0-9][A-Za-z0-9 &.'/-]{1,40})",
        Pattern.CASE_INSENSITIVE
    );

    // A completed outgoing payment or transfer — becomes an expense. Includes
    // "DuitNow" since several banks (CIMB OCTO observed) label an outgoing
    // instant transfer with no other outgoing-flavoured word at all, e.g.
    // "DuitNow to Acct RM1.00 to NAME".
    private static final Pattern OUTGOING_KEYWORDS = Pattern.compile(
        "debit|paid|payment|purchase|spent|transferred|transfer successful|transaction successful"
            + "|duitnow|withdrawal|withdrew|pembayaran|bayaran|pemindahan|berjaya",
        Pattern.CASE_INSENSITIVE
    );

    // Money coming IN — becomes an income entry instead of an expense.
    private static final Pattern INCOMING_KEYWORDS = Pattern.compile(
        "received|credited|incoming|deposit|refund|diterima|dikreditkan",
        Pattern.CASE_INSENSITIVE
    );

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        String bankName = BANK_PACKAGES.get(sbn.getPackageName());
        if (bankName == null) return;

        Notification notification = sbn.getNotification();
        if (notification == null) return;
        Bundle extras = notification.extras;
        if (extras == null) return;

        CharSequence titleSeq = extras.getCharSequence(Notification.EXTRA_TITLE);
        CharSequence textSeq = extras.getCharSequence(Notification.EXTRA_TEXT);
        CharSequence bigTextSeq = extras.getCharSequence(Notification.EXTRA_BIG_TEXT);
        String title = titleSeq == null ? "" : titleSeq.toString();
        String body = bigTextSeq != null ? bigTextSeq.toString() : (textSeq != null ? textSeq.toString() : "");
        String fullText = (title + " " + body).trim();
        if (fullText.isEmpty()) return;

        // Incoming takes priority: bank wording for a received transfer can
        // still contain an outgoing-flavoured word in the wrong place, but
        // never the other way round in practice, so check it first.
        String direction;
        if (INCOMING_KEYWORDS.matcher(fullText).find()) {
            direction = "in";
        } else if (OUTGOING_KEYWORDS.matcher(fullText).find()) {
            direction = "out";
        } else {
            return;
        }

        Matcher amountMatcher = AMOUNT_PATTERN.matcher(fullText);
        if (!amountMatcher.find()) return;
        double amount;
        try {
            amount = Double.parseDouble(amountMatcher.group(1).replace(",", ""));
        } catch (NumberFormatException e) {
            return;
        }
        if (amount <= 0) return;

        // Take the LAST "to"/"from"/... match, not the first — wording like
        // "DuitNow to Acct RM1.00 to NAME" has an earlier false match
        // ("to Acct ...") before the real recipient.
        String merchant = "";
        Matcher merchantMatcher = MERCHANT_PATTERN.matcher(fullText);
        while (merchantMatcher.find()) {
            merchant = merchantMatcher.group(1).trim();
        }
        if (!merchant.isEmpty()) {
            // Bank wording often continues past the payee's name into whose
            // account received it ("...to Jane Doe's Maybank account"), their
            // bank ("NAME/Maybank"), or the transaction date/time ("NAME on
            // 01-Oct-2026, 11:00:33") — cut at whichever of those comes first
            // so the merchant field is just the name.
            int cut = merchant.length();
            int possessive = merchant.indexOf("'s ");
            if (possessive > 0) cut = Math.min(cut, possessive);
            int onDate = merchant.indexOf(" on ");
            if (onDate > 0) cut = Math.min(cut, onDate);
            int slash = merchant.indexOf('/');
            if (slash > 0) cut = Math.min(cut, slash);
            merchant = merchant.substring(0, cut).trim();
        }

        try {
            JSONObject transaction = new JSONObject();
            transaction.put("id", UUID.randomUUID().toString());
            transaction.put("bank", bankName);
            transaction.put("amount", amount);
            transaction.put("merchant", merchant);
            transaction.put("direction", direction);
            transaction.put("rawText", fullText);
            transaction.put("postedAt", sbn.getPostTime());
            TransactionNotificationStore.add(getApplicationContext(), transaction);
            BankNotificationCapturePlugin.notifyActiveListener(transaction);
        } catch (Exception ignored) {
        }
    }
}
