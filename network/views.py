import time
import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import JsonResponse
from django.http import HttpResponse, HttpResponseRedirect
from django.core.paginator import Paginator
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt

from .models import User, Follow, Post, Like
from .forms import NewPostForm

def index(request):

    if request.method == "POST":
        form = NewPostForm(request.POST)
        if form.is_valid():

            creator = User.objects.get(username=request.user)
            content = form.cleaned_data["content"]

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
    time.sleep(.4)

    start = int(request.GET.get("start") or 0)
    end = int(request.GET.get("end") or 10)
    view = request.GET.get("view")

    if view == "profile-view": # Return all posts
        username = request.GET.get("username")
        creator = User.objects.get(username=username)
        posts = Post.objects.filter(creator=creator)
        posts = posts.order_by("-date")

    if view == "all-view":
        posts = Post.objects.all()
        posts = posts.order_by("-date")[start:end]

    if view == "following-view":
        if request.user.is_anonymous:
            return JsonResponse({"loggedin": False})
        else:
            # SELECT *
            # FROM User
            # INNER JOIN Follow ON User.id = Follow.user.id
            # WHERE Follow.follower.id = request.user.id
            followingUsers = User.objects.filter(follow__follower=request.user)
            posts = Post.objects.filter(creator__in=followingUsers)
            posts = posts.order_by("-date")[start:end]


    if request.user.is_anonymous:
        objects = [post.serialize() for post in posts]

    else:
        objects = []
        for post in posts:
            serializedPost = post.serialize()
            if Like.objects.filter(user=request.user, post=post).exists():
                serializedPost["liked"] = True
            objects.append(serializedPost)

    return JsonResponse({
        "loggedin": True,
        "posts": objects
        }, 
        safe=False)
    

def profile(request, username):
    profileUser = User.objects.get(username=username)
    following = Follow.objects.filter(follower=profileUser).count()
    followers = Follow.objects.filter(user=profileUser).count()

    return render(request, "network/profile.html", {
        "profile": profileUser,
        "followers": followers,
        "following": following
    })


@csrf_exempt
@login_required
def follow(request):

    otherUsername = request.GET.get("user")
    if User.objects.filter(username=otherUsername).exists():
        otherUser = User.objects.get(username=otherUsername)
    else:
        return JsonResponse({"error": "User not found"}, status=404)
    
    # Check if user follows the other user
    following = Follow.objects.filter(user=otherUser, follower=request.user).exists()

    if request.method == "GET":
        return JsonResponse({"following": following}, status=200)

    if request.method == "PUT":
        if following:
            follow = Follow.objects.get(user=otherUser, follower=request.user)
            follow.delete()
            return JsonResponse({"following": not following}, status=204)
        
        else:
            follow = Follow(user=otherUser, follower=request.user)
            if not follow.is_valid_follow():
                return JsonResponse({"error": "Cannot follow self"}, status=400)
            follow.save()
            return JsonResponse({"following": not following}, status=201)

    return JsonResponse({"error": "Only GET and PUT requests accepted"}, status=405)


@csrf_exempt
@login_required
def edit(request, postID):

    if request.method != "PUT":
        return JsonResponse({"error": "Request not PUT"}, status=405)

    try:
        post = Post.objects.get(id=postID)
    except Post.DoesNotExist:
        return JsonResponse({"error": "Post not found"}, status=404)

    if request.user != post.creator:
        return JsonResponse({"error": "You do not have permission to edit this post"}, status=401)
    
    data = json.loads(request.body)
    if data.get("content") is not None:
        post.content = data.get("content")
    post.save()
    return JsonResponse({}, status=201)


@csrf_exempt
def like(request, postID):

    if request.method != "PUT":
        # Request method not supported
        return JsonResponse({"error": "Request not PUT"}, status=405)

    try:
        post = Post.objects.get(id=postID)
    except Post.DoesNotExist:
        return JsonResponse({"error": "Post not found"}, status=404)
    
    if request.user.is_anonymous:
        # Unauthorized
        return JsonResponse({"error": "Not logged in"}, status=401)

    if Like.objects.filter(user=request.user, post=post).exists():
        like = Like.objects.get(user=request.user, post=postID)
        like.delete()
        return JsonResponse({}, status=204) # Resource updated successfully
    else:
        like = Like(user=request.user, post=post)
        like.save()
        return JsonResponse({}, status=201) # Resource created