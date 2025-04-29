from rest_framework import serializers
from django.contrib.auth import get_user_model
from dj_rest_auth.serializers import UserDetailsSerializer
from dj_rest_auth.registration.serializers import RegisterSerializer
from .models import JournalEntry, MoodLog

User = get_user_model()

# --- Model Serializers ---

class JournalEntrySerializer(serializers.ModelSerializer):
    """Serializer for JournalEntry objects."""
    # Make user field read-only, it will be set automatically based on request user
    user = serializers.PrimaryKeyRelatedField(read_only=True, default=serializers.CurrentUserDefault())
    # Display user's email in read operations (optional)
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = JournalEntry
        fields = ['id', 'user', 'user_email', 'content', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'user_email', 'created_at', 'updated_at'] # User is set by view

    def create(self, validated_data):
        # Ensure the user is set from the request context
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class MoodLogSerializer(serializers.ModelSerializer):
    """Serializer for MoodLog objects."""
    user = serializers.PrimaryKeyRelatedField(read_only=True, default=serializers.CurrentUserDefault())
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = MoodLog
        fields = ['id', 'user', 'user_email', 'mood_rating', 'timestamp']
        read_only_fields = ['id', 'user', 'user_email', 'timestamp']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


# --- Authentication Serializers ---

class CurrentUserSerializer(UserDetailsSerializer):
    """
    Serializer to display current user details.
    Extends dj_rest_auth's default to potentially add more fields.
    """
    class Meta(UserDetailsSerializer.Meta):
        fields = UserDetailsSerializer.Meta.fields + ('id',) # Add 'id' field
        # Add any other User model fields you want to expose here
        # e.g., fields = ('id', 'email', 'username', 'first_name', 'last_name')


class CustomRegisterSerializer(RegisterSerializer):
    """
    Custom registration serializer.
    We can add custom fields here if needed (e.g., first_name, last_name).
    Currently, it just uses the default dj-rest-auth behavior (email/password).
    """
    # Example: Add first_name and last_name fields (uncomment if needed)
    # first_name = serializers.CharField(required=False, max_length=30)
    # last_name = serializers.CharField(required=False, max_length=150)

    # def custom_signup(self, request, user):
    #     # Called during registration to save custom fields
    #     user.first_name = self.validated_data.get('first_name', '')
    #     user.last_name = self.validated_data.get('last_name', '')
    #     user.save(update_fields=['first_name', 'last_name'])
    pass # No customization needed for now
