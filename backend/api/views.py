from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import JournalEntry, MoodLog
from .serializers import JournalEntrySerializer, MoodLogSerializer
from .permissions import IsOwnerOrReadOnly # Custom permission


# --- Journal Entry Views ---

class JournalEntryListCreate(generics.ListCreateAPIView):
    """
    API endpoint for listing and creating Journal Entries.
    - GET: Returns a list of journal entries for the authenticated user.
    - POST: Creates a new journal entry for the authenticated user.
    """
    serializer_class = JournalEntrySerializer
    permission_classes = [permissions.IsAuthenticated] # Must be logged in

    def get_queryset(self):
        """Ensure users only see their own entries."""
        user = self.request.user
        return JournalEntry.objects.filter(user=user)

    def perform_create(self, serializer):
        """Associate the entry with the current logged-in user."""
        serializer.save(user=self.request.user)


class JournalEntryDetail(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint for retrieving, updating, or deleting a specific Journal Entry.
    - GET: Returns a single journal entry.
    - PUT/PATCH: Updates a journal entry.
    - DELETE: Deletes a journal entry.
    """
    serializer_class = JournalEntrySerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly] # Must own the object to modify/delete

    def get_queryset(self):
        """Ensure users can only access their own entries."""
        user = self.request.user
        return JournalEntry.objects.filter(user=user)


# --- Mood Log Views ---

class MoodLogListCreate(generics.ListCreateAPIView):
    """
    API endpoint for listing and creating Mood Logs.
    - GET: Returns a list of mood logs for the authenticated user.
    - POST: Creates a new mood log for the authenticated user.
    """
    serializer_class = MoodLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Ensure users only see their own logs."""
        user = self.request.user
        # Optional: Add filtering by date range?
        # E.g., ?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
        queryset = MoodLog.objects.filter(user=user)
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(timestamp__date__gte=start_date)
        if end_date:
             queryset = queryset.filter(timestamp__date__lte=end_date)
        return queryset

    def perform_create(self, serializer):
        """Associate the log with the current logged-in user."""
        serializer.save(user=self.request.user)

# Note: RetrieveUpdateDestroy view for MoodLog might not be necessary for MVP
# If needed, it would be similar to JournalEntryDetail but using MoodLog model/serializer
# class MoodLogDetail(generics.RetrieveUpdateDestroyAPIView):
#     serializer_class = MoodLogSerializer
#     permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
#
#     def get_queryset(self):
#         user = self.request.user
#         return MoodLog.objects.filter(user=user)
