# Generated by Django 4.2.5 on 2023-09-28 16:45

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('network', '0002_user_numfollowers_user_numfollows_post_like_follow'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='post',
            name='numLikes',
        ),
        migrations.RemoveField(
            model_name='user',
            name='numFollowers',
        ),
        migrations.RemoveField(
            model_name='user',
            name='numFollows',
        ),
        migrations.AlterField(
            model_name='like',
            name='user',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL),
        ),
    ]