from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass

class Follow(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name="followers")

    def __str__(self):
        return f"{self.follower} is following {self.user}"
    
    def is_valid_follow(self):
        return self.user != self.follower
    
class Post(models.Model):
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    content = models.CharField(max_length=1024, blank=False)
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        if len(self.content) > 25:
            post = self.content[:25] + "..."
        else:
            post = self.content

        return f"{self.creator} posted {post} on {self.date}"
    
    def serialize(self):
        return {
            "creator": self.creator.username,
            "content": self.content,
            "date": self.date.strftime("%a %d %b %Y %I:%M %p"),
            "likes": self.likes.count()
        }

    def is_valid_post(self):
        return len(self.content) != 0
    
class Like(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="likes")

    def __str__(self):
        return f"{self.user} likes {self.post}"
    
    def is_valid_like(self):
        return self.user != self.post.creator
    
