document.addEventListener('DOMContentLoaded', () => {
    
    profileUsername = document.querySelector('#profileuser').value;
    username = document.querySelector('#username').value;
    
    // Check if following already
    fetch(`/follow?user=${profileUsername}`, {
        method: "GET"
    })
    .then(response => response.json())
    .then(data => {
        if (data.following) {
            document.querySelector('#follow').innerHTML = 'Unfollow';
            follow.classList.remove('btn-primary');
            follow.classList.add('btn-outline-primary');
        } else {
            document.querySelector('#follow').innerHTML = 'Follow';
            follow.classList.add('btn-primary');
            follow.classList.remove('btn-outline-primary');
        }
    });

    getPosts(profileUsername);


    // Button function
    document.querySelector('#follow').addEventListener('click', () => {

        fetch(`/follow?user=${profileUsername}`, {
            method: "PUT"
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Request failed with status: ${response.status}`); 
            }

            if (response.status === 201){
                document.querySelector('#follow').innerHTML = 'Unfollow';
                follow.classList.remove('btn-primary');
                follow.classList.add('btn-outline-primary');
                
                var followers = document.querySelector('#followers');
                count = followers.innerHTML;
                count++;
                followers.innerHTML = count;

            }

            if (response.status === 204){
                document.querySelector('#follow').innerHTML = 'Follow';
                follow.classList.add('btn-primary');
                follow.classList.remove('btn-outline-primary');
                
                var followers = document.querySelector('#followers');
                count = followers.innerHTML;
                count--;
                followers.innerHTML = count;
            }
        });
    });


})


function getPosts(profileUsername) {

    return new Promise((resolve, reject) => {
        fetch(`/posts?view=profile-view&username=${profileUsername}`)
            .then(response => response.json())
            .then(data => {
                
                // Populate view with posts
                view = document.querySelector('#posts')
                if (data.posts.length == 0) {
                    alert("No more posts")
                    return;
                }
                for (let i = 0; i < data.posts.length; i++) {
                    add_post(data.posts[i], view, username);
                };

                resolve(data);

            });
    });
};


// Add a new post with given contents to DOM
function add_post(contents, parent, username) {

    // Create container
    const container = document.createElement("container");
    container.classList.add("border", "rounded", "post-container");

    // Username
    const creator = document.createElement("h3");
    const link = document.createElement("a");
    link.href = `/profile/${contents.creator}`;
    link.innerHTML = contents.creator;
    creator.appendChild(link);

    // Username and edit button container
    const topContainer = document.createElement("div");
    topContainer.classList.add("full-split-container");
    topContainer.appendChild(creator);

    // Body
    const body = document.createElement("div");
    body.classList.add("form-group", "post-content", "border");
    body.innerHTML = contents.content;

    // Likes
    const likes = createLikeButton(contents);

    // Date
    const date = document.createElement("div");
    date.innerHTML= `${contents.date}`;

    // Likes and date container
    const statsContainer = document.createElement("div");
    statsContainer.classList.add("full-split-container");
    statsContainer.appendChild(likes);
    statsContainer.appendChild(date);

    // Add edit button to the top container (client side)
    if (contents.creator === username) {

        let originalPost = body.innerHTML;

        function createEditButton() {

            const editBtn = document.createElement("button");
            editBtn.classList.add("btn", "btn-primary");
            editBtn.innerHTML = "Edit";
            editBtn.addEventListener("click", () => {

                // Change original post to text form with cancel save btns
                body.classList.remove("post-content", "border");
                originalPost = body.innerHTML;
                body.innerHTML = "";
                const textForm = document.createElement("textarea");
                textForm.classList.add("form-control");
                textForm.value = originalPost;
                body.appendChild(textForm);
                editBtn.remove();
                createCancelAndSaveButtons();

            });
            topContainer.appendChild(editBtn)
        }

        function createCancelAndSaveButtons() {
            const group = document.createElement("div");

            // Cancel button
            const cancelBtn = document.createElement("button");
            cancelBtn.classList.add("btn", "btn-primary");
            cancelBtn.innerHTML = "Cancel";
            cancelBtn.addEventListener("click", () => {

                // Change textform to original post with edit btn
                body.classList.add("post-content", "border");
                body.innerHTML = originalPost;
                group.remove();
                createEditButton();

            });
            group.appendChild(cancelBtn);

            // Save button
            const saveBtn = document.createElement("button");
            saveBtn.classList.add("btn", "btn-primary");
            saveBtn.style.marginLeft = '10px';
            saveBtn.innerHTML = "Save";
            saveBtn.addEventListener("click", () => {

                fetch(`/edit/${contents.id}`, {
                    method: "PUT",
                    body: JSON.stringify({
                        content: body.firstElementChild.value
                    })
                })
                .then(response => {

                    if (response.status === 201) {

                        // Change textform to original post with edit btn
                        body.classList.add("post-content", "border");
                        body.innerHTML = body.firstElementChild.value;
                        group.remove();
                        createEditButton();
                    } else {
                        alert(`Error changing post: ${response.json().error}`)
                    }
                })

            });
            group.appendChild(saveBtn);
            topContainer.appendChild(group);
        }

        createEditButton();
    }

    // Add components to the post container
    container.appendChild(topContainer);
    container.appendChild(body);
    container.appendChild(statsContainer);


    // Add post to DOM
    parent.append(container);
};

function createLikeButton(contents) {

    const likes = document.createElement("div");
    const likeBtn = document.createElement("span");
    likeBtn.classList.add("heart")

    const likeCount = document.createElement("span");
    likeCount.innerHTML = contents.likes;

    emptyHeart = `<?xml version="1.0" standalone="no"?>
    <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 20010904//EN"
        "http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd">
    <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
        width="15pt" height="15pt" viewBox="0 0 45.000000 45.000000"
        preserveAspectRatio="xMidYMid meet">
    <g transform="translate(0.000000,45.000000) scale(0.100000,-0.100000)"
    fill="#2596be" stroke="none">
    <path d="M83 390 c-57 -38 -66 -116 -23 -200 21 -42 93 -111 140 -135 31 -16
    36 -16 67 -1 86 41 173 158 173 234 0 103 -113 158 -180 87 l-24 -25 -26 25
    c-37 36 -87 41 -127 15z m108 -70 c21 -22 41 -40 44 -40 3 0 23 18 44 40 43
    45 62 49 91 20 40 -40 13 -128 -58 -192 -66 -60 -74 -62 -118 -29 -54 39 -80
    70 -99 113 -20 50 -19 70 6 102 28 36 46 33 90 -14z"/>
    </g>
    </svg>
    `;
    filledHeart = `<?xml version="1.0" standalone="no"?>
    <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 20010904//EN"
        "http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd">
    <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
        width="15pt" height="15pt" viewBox="0 0 45.000000 45.000000"
        preserveAspectRatio="xMidYMid meet">
    <g transform="translate(0.000000,45.000000) scale(0.100000,-0.100000)"
    fill="#2596be" stroke="none">
    <path d="M83 390 c-57 -38 -66 -116 -23 -200 21 -42 93 -111 140 -135 31 -16
    36 -16 67 -1 86 41 173 158 173 234 0 103 -113 158 -180 87 l-24 -25 -26 25
    c-37 36 -87 41 -127 15z"/>
    </g>
    </svg>
    `;
    if (contents.liked) {
        likeBtn.innerHTML = filledHeart;
    } else {
        likeBtn.innerHTML = emptyHeart;
    }
    likeBtn.addEventListener('click', () => {

        fetch(`/like/${contents.id}`, {
            method: "PUT"
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Request failed with status: ${response.status}`);
            }
            
            // Like was removed
            if (response.status === 204) {
                likeBtn.innerHTML = emptyHeart;
                var count = likeCount.innerHTML;
                count--;
                likeCount.innerHTML = count;
            }

            // Like was added
            if (response.status === 201) {
                likeBtn.innerHTML = filledHeart;
                var count = likeCount.innerHTML;
                count++;
                likeCount.innerHTML = count;
            }
        });
    });
    likes.appendChild(likeBtn);
    likes.appendChild(likeCount);

    return likes
}