package com.placify.config;

/**
 * Utility class for sanitizing user inputs to prevent stored XSS attacks.
 * Strips all HTML tags from input strings.
 */
public final class SanitizationUtil {

    private SanitizationUtil() {
        // Utility class — not instantiable
    }

    /**
     * Strips all HTML tags from the input string.
     * Returns null if input is null, empty string if input is blank.
     */
    public static String stripHtml(String input) {
        if (input == null) return null;
        // Remove all HTML tags
        return input.replaceAll("<[^>]*>", "").trim();
    }
}
