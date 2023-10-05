import time
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import JsonResponse
from django.http import HttpResponse, HttpResponseRedirect
from django.core.paginator import Paginator
from django.shortcuts import render
from django.urls import reverse

from .models import User, Follow, Post, Like
from .forms import NewPostForm


def index(request):

    if request.method == "POST":
        form = NewPostForm(request.POST)
        if form.is_valid():

            # Process data
            creator = User.objects.get(username=request.user)
            content = form.cleaned_data["content"]

            # Store in db
            try:
                post = Post(creator=creator, content=content)
                post.save()

            except Exception as e:
                print(f"Error creating post: {e}")

    form = NewPostForm()
    return render(request, "network/index.html", {
        "form": form,
        })


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")


def posts(request):

    # Simulate loading
    time.sleep(.5)

    start = int(request.GET.get("start") or 0)
    end = int(request.GET.get("end") or 10)
    view = request.GET.get("view")

    if view == "all-view":
        posts = Post.objects.all()

    elif request.user.is_anonymous:
        return JsonResponse({"loggedin": False})
    
    else:
        # SELECT *
        # FROM User
        # INNER JOIN Follow ON User.id = Follow.user.id
        # WHERE Follow.follower.id = request.user.id
        followingUsers = User.objects.filter(follow__follower=request.user)
        posts = Post.objects.filter(creator__in=followingUsers)

    # Return posts in reverse chronological order
    posts = posts.order_by("-date")[start:end]
    return JsonResponse({"posts": [post.serialize() for post in posts]}, safe=False)
    

def profile(request, username):
    profileUser = User.objects.get(username=username)
    following = Follow.objects.filter(follower=profileUser).count
    followers = Follow.objects.filter(user=profileUser).count
    posts = Post.objects.filter(creator=profileUser)
    posts = posts.order_by("-date")

    return render(request, "network/profile.html", {
        "profile": profileUser,
        "posts": posts,
        "followers": followers,
        "following": following
    })


@login_required
def follow(request):

    # Check if user exists
    otherUsername = request.GET.get("user")
    if User.objects.filter(username=otherUsername).exists():
        otherUser = User.objects.get(username=otherUsername)
    else:
        return JsonResponse({"error": "User not found"})

    # Process fetch request
    check = int(request.GET.get("check"))
    follow = int(request.GET.get("follow") or 0)

    if check:
        following = Follow.objects.filter(user=otherUser, follower=request.user).exists()
        return JsonResponse({"following": following})
    
    elif follow:
        follow = Follow(user=otherUser, follower=request.user)
        if follow.is_valid_follow():
            follow.save()
            return JsonResponse({"OK": 200})
        else:
            return JsonResponse({"error": "Cannot follow self"})

    else:
        follow = Follow.objects.get(user=otherUser, follower=request.user)
        follow.delete()
        return JsonResponse({"OK": 200})


