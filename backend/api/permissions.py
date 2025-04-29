from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit or delete it.
    Assumes the model instance has an 'user' attribute.
    Read permissions are allowed for any request (GET, HEAD, OPTIONS).
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any authenticated request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            # Ensure the user is authenticated for read access
            return request.user and request.user.is_authenticated

        # Write permissions (PUT, PATCH, DELETE) are only allowed to the owner of the object.
        # Check if the object has a 'user' attribute and if it matches the request user.
        return hasattr(obj, 'user') and obj.user == request.user
