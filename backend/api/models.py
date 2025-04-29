from django.db import models
from django.conf import settings # Recommended way to refer to the User model
from django.core.validators import MinValueValidator, MaxValueValidator

# Using settings.AUTH_USER_MODEL allows for custom user models
User = settings.AUTH_USER_MODEL

class JournalEntry(models.Model):
    """Represents a single text journal entry by a user."""
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE, # Delete entries if user is deleted
        related_name='journal_entries'
    )
    content = models.TextField(
        help_text="The rich text content of the journal entry (can store HTML)."
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
        return f"Entry by {self.user.username or self.user.email} on {self.created_at.strftime('%Y-%m-%d %H:%M')}"


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
    # notes = models.TextField(blank=True, null=True, help_text="Optional notes about the mood.")
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

# If using predefined mood tags instead of/in addition to rating:
# class MoodTag(models.Model):
#     name = models.CharField(max_length=50, unique=True)
#     # Optional: Add color or icon association
#     # color = models.CharField(max_length=7, blank=True, null=True) # e.g., #FF0000
#
#     def __str__(self):
#         return self.name
#
# class MoodLogWithTag(models.Model):
#     user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mood_logs_tagged')
#     mood_tag = models.ForeignKey(MoodTag, on_delete=models.SET_NULL, null=True, blank=True)
#     timestamp = models.DateTimeField(auto_now_add=True)
#     # ... other fields like notes ...
#
#     class Meta:
#         ordering = ['-timestamp']
#
#     def __str__(self):
#         tag_name = self.mood_tag.name if self.mood_tag else 'Untagged'
#         return f"Mood '{tag_name}' by {self.user.username or self.user.email} on {self.timestamp.strftime('%Y-%m-%d %H:%M')}"
