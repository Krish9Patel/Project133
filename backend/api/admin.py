from django.contrib import admin
from .models import JournalEntry, MoodLog

# Register your models here.

@admin.register(JournalEntry)
class JournalEntryAdmin(admin.ModelAdmin):
    list_display = ('user', 'created_at', 'updated_at', 'content_status')
    list_filter = ('user', 'created_at')
    search_fields = ('user__username', 'user__email') # Cannot directly search encrypted content
    readonly_fields = ('created_at', 'updated_at', 'get_decrypted_content') # Show decrypted content only in detail view

    def content_status(self, obj):
        # Avoid decrypting in list view for performance
        return "Stored (Encrypted)"
    content_status.short_description = 'Content Status'

    def get_decrypted_content(self, obj):
        """
        Method to display decrypted content in the admin detail view.
        Handle potential decryption errors gracefully.
        """
        try:
            return obj.content
        except Exception as e:
            # Log the error or provide a more specific message if needed
            print(f"Error decrypting content for entry {obj.id}: {e}")
            return "[Error decrypting content]"
    get_decrypted_content.short_description = 'Decrypted Content'

    # Override fields if you want 'get_decrypted_content' to appear
    # Make sure the original 'content' field is not directly editable if using EncryptedTextField
    # fields = ('user', 'created_at', 'updated_at', 'get_decrypted_content') # Example


@admin.register(MoodLog)
class MoodLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'mood_rating', 'timestamp')
    list_filter = ('user', 'mood_rating', 'timestamp')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('timestamp',)
