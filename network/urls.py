
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("profile/<str:username>", views.profile, name="profile"),

    # API paths
    path("posts", views.posts, name="posts"),
    path("like/<int:postID>", views.like, name="like"),
    path("follow", views.follow, name="follow"),
    path("edit/<int:postID>", views.edit, name="edit")
]
