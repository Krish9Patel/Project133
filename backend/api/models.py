from django.db import models
from django.conf import settings # Recommended way to refer to the User model
from django.core.validators import MinValueValidator, MaxValueValidator
from fernet_fields import EncryptedTextField # Import for encryption

# Using settings.AUTH_USER_MODEL allows for custom user models
User = settings.AUTH_USER_MODEL

class JournalEntry(models.Model):
    """Represents a single text journal entry by a user."""
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE, # Delete entries if user is deleted
        related_name='journal_entries'
    )
    # Apply encryption to the content field
    content = EncryptedTextField(
        help_text="The encrypted rich text content of the journal entry."
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when the entry was created."
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp when the entry was last updated."
    )

    class Meta:
        ordering = ['-created_at'] # Default ordering: newest first
        verbose_name = "Journal Entry"
        verbose_name_plural = "Journal Entries"

    def __str__(self):
        # Avoid decrypting content for __str__ representation if possible
        # Or show a placeholder
        content_preview = "Encrypted Content"
        # If you need a snippet, you'd have to decrypt, which might be slow for lists
        # try:
        #     content_preview = self.content[:50] + '...' if len(self.content) > 50 else self.content
        # except Exception: # Catch potential decryption errors
        #     content_preview = "[Decryption Error]"

        return f"Entry by {self.user.username or self.user.email} on {self.created_at.strftime('%Y-%m-%d %H:%M')} - {content_preview}"


class MoodLog(models.Model):
    """Represents a single mood log entry by a user."""
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE, # Delete logs if user is deleted
        related_name='mood_logs'
    )
    mood_rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)], # Example: 1-5 scale
        help_text="User's mood rating (e.g., 1-5)."
    )
    # Consider adding an optional notes field:
    # notes = EncryptedTextField(blank=True, null=True, help_text="Optional encrypted notes about the mood.")
    timestamp = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when the mood was logged."
    )

    class Meta:
        ordering = ['-timestamp'] # Default ordering: newest first
        verbose_name = "Mood Log"
        verbose_name_plural = "Mood Logs"

    def __str__(self):
        return f"Mood {self.mood_rating}/5 by {self.user.username or self.user.email} on {self.timestamp.strftime('%Y-%m-%d %H:%M')}"

# Note: If using MoodLogWithTag, consider encrypting its 'notes' field if added.
# class MoodTag(models.Model):
#     name = models.CharField(max_length=50, unique=True)
#     def __str__(self):
#         return self.name
#
# class MoodLogWithTag(models.Model):
#     user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mood_logs_tagged')
#     mood_tag = models.ForeignKey(MoodTag, on_delete=models.SET_NULL, null=True, blank=True)
#     timestamp = models.DateTimeField(auto_now_add=True)
#     notes = EncryptedTextField(blank=True, null=True, help_text="Optional encrypted notes.")
#
#     class Meta:
#         ordering = ['-timestamp']
#
#     def __str__(self):
#         tag_name = self.mood_tag.name if self.mood_tag else 'Untagged'
#         return f"Mood '{tag_name}' by {self.user.username or self.user.email} on {self.timestamp.strftime('%Y-%m-%d %H:%M')}"
