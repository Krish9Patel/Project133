from django.contrib import admin
from .models import JournalEntry, MoodLog

# Register your models here.

@admin.register(JournalEntry)
class JournalEntryAdmin(admin.ModelAdmin):
    list_display = ('user', 'created_at', 'updated_at', 'content_snippet')
    list_filter = ('user', 'created_at')
    search_fields = ('content', 'user__username', 'user__email')
    readonly_fields = ('created_at', 'updated_at')

    def content_snippet(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_snippet.short_description = 'Content Snippet'


@admin.register(MoodLog)
class MoodLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'mood_rating', 'timestamp')
    list_filter = ('user', 'mood_rating', 'timestamp')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('timestamp',)
