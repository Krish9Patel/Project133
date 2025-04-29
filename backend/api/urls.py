from django.urls import path
from . import views

# Define URL patterns for the API endpoints
urlpatterns = [
    # Journal Entry endpoints
    path('journal/', views.JournalEntryListCreate.as_view(), name='journal-list-create'),
    path('journal/<int:pk>/', views.JournalEntryDetail.as_view(), name='journal-detail'),

    # Mood Log endpoints
    path('moodlog/', views.MoodLogListCreate.as_view(), name='moodlog-list-create'),
    # Uncomment if MoodLogDetail view is implemented
    # path('moodlog/<int:pk>/', views.MoodLogDetail.as_view(), name='moodlog-detail'),
]
