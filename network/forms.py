from django import forms

class NewPostForm(forms.Form):
    content = forms.CharField(max_length=1024,
                              widget=forms.Textarea(attrs={'class': 'form-control'}),
                              label="")