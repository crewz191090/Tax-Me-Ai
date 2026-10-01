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
 * and parses out completed payments ("you spent RM12.34 at ...") so they can
 * be turned into a receipt without the user retyping the amount. Every other
 * notification — from any other app, and non-payment notifications from the
 * banking apps themselves (balance alerts, OTPs, marketing) — is read by the
 * OS but never inspected, stored, or forwarded by this service.
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

    // Best-effort merchant extraction: the word(s) following a preposition
    // that typically introduces the payee in both English and Bahasa Melayu
    // bank wording. Deliberately generic rather than bank-specific, since
    // exact notification wording varies by bank and changes with app updates.
    private static final Pattern MERCHANT_PATTERN = Pattern.compile(
        "(?:to|at|kepada|di)\\s+([A-Za-z0-9][A-Za-z0-9 &.'/-]{1,40})",
        Pattern.CASE_INSENSITIVE
    );

    // Only notifications that look like a completed outgoing payment or
    // transfer are captured — balance alerts, OTP codes, and marketing
    // pushes are deliberately left alone.
    private static final Pattern SPEND_KEYWORDS = Pattern.compile(
        "debit|paid|payment|purchase|spent|transferred|transfer successful|transaction successful"
            + "|pembayaran|bayaran|pemindahan|berjaya",
        Pattern.CASE_INSENSITIVE
    );

    // Excludes money coming IN even if it happens to also match a word above
    // (e.g. "transferred" can appear in "RM50 was transferred to your
    // account") — these are never expenses.
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
        if (!SPEND_KEYWORDS.matcher(fullText).find()) return;
        if (INCOMING_KEYWORDS.matcher(fullText).find()) return;

        Matcher amountMatcher = AMOUNT_PATTERN.matcher(fullText);
        if (!amountMatcher.find()) return;
        double amount;
        try {
            amount = Double.parseDouble(amountMatcher.group(1).replace(",", ""));
        } catch (NumberFormatException e) {
            return;
        }
        if (amount <= 0) return;

        String merchant = "";
        Matcher merchantMatcher = MERCHANT_PATTERN.matcher(fullText);
        if (merchantMatcher.find()) {
            merchant = merchantMatcher.group(1).trim();
            // Bank wording often continues past the payee's name into whose
            // account received it, e.g. "...to Jane Doe's Maybank account" —
            // cut that off so the merchant field is just the name.
            int possessive = merchant.indexOf("'s ");
            if (possessive > 0) {
                merchant = merchant.substring(0, possessive).trim();
            }
        }

        try {
            JSONObject transaction = new JSONObject();
            transaction.put("id", UUID.randomUUID().toString());
            transaction.put("bank", bankName);
            transaction.put("amount", amount);
            transaction.put("merchant", merchant);
            transaction.put("rawText", fullText);
            transaction.put("postedAt", sbn.getPostTime());
            TransactionNotificationStore.add(getApplicationContext(), transaction);
            BankNotificationCapturePlugin.notifyActiveListener(transaction);
        } catch (Exception ignored) {
        }
    }
}
