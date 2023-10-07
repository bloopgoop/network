from django.test import TestCase, Client

from .models import User, Follow, Post, Like

# Create your tests here.
class FollowTestCase(TestCase):

    def setUp(self):
        #Create users
        user1 = User.objects.create(username="AAA")
        user2 = User.objects.create(username="BBB")

        #Create follows
        follow1 = Follow.objects.create(user=user1, follower=user2)
        follow2 = Follow.objects.create(user=user1, follower=user1)

    def test_follow(self):
        user1 = User.objects.get(username="AAA")
        user2 = User.objects.get(username="BBB")
        a = Follow.objects.get(user=user1, follower=user2)
        self.assertTrue(a.is_valid_follow())

    def test_bad_follow(self):
        user1 = User.objects.get(username="AAA")
        a = Follow.objects.get(user=user1, follower=user1)
        self.assertFalse(a.is_valid_follow())
        
class PostTestCase(TestCase):

    def setUp(self):
        user1 = User.objects.create(username="AAA")

        Post.objects.create(creator=user1, content="",)

    def test_post(self):
        a = Post.objects.get()
        self.assertFalse(a.is_valid_post())


class LikeTestCase(TestCase):

    def setUp(self):
        #Create users
        user1 = User.objects.create(username="AAA")
        user2 = User.objects.create(username="BBB")

        #Create posts
        post1 = Post.objects.create(creator=user1, content="hello, world!")
        post2 = Post.objects.create(creator=user2, content="goodbye")

        #Create likes
        like1 = Like.objects.create(user=user1, post=post1)
        like2 = Like.objects.create(user=user1, post=post2)

    def test_bad_like(self):
        user1 = User.objects.get(username="AAA")        
        post1 = Post.objects.get(id=1)

        # User can not like their own post
        a = Like.objects.get(user=user1, post=post1)
        self.assertFalse(a.is_valid_like())

    def test_good_like(self):
        user1 = User.objects.get(username="AAA")
        post2 = Post.objects.get(id=2)

        a = Like.objects.get(user=user1, post=post2)
        self.assertTrue(a.is_valid_like())
        self.assertEqual(a.post.likes.count(), 1)

class IndexTestCase(TestCase):

    def test_get_index(self):
        c = Client()
        response = c.get("/")
        self.assertEqual(response.status_code, 200)

class ProfileTestCase(TestCase):

    def setUp(self):
        #Create users
        user1 = User.objects.create(username="AAA")
        user2 = User.objects.create(username="BBB")

        #Create follows
        follow1 = Follow.objects.create(user=user1, follower=user2)

    def test_profile(self):
        c = Client()
        response = c.get("/profile/AAA")
        self.assertEqual(response.status_code, 200)

    def test_follow(self):
        c = Client()
        response = c.get("/profile/AAA")
        self.assertEqual(response.context["followers"], 1)