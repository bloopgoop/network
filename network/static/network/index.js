// Variables to keep track of the all posts view
var numAllPosts = 0;

// Variables to keep track of the following posts view
var numFollowingPosts = 0;

// Variables to manipulate what the user sees
var numPosts = 0;
var view;
var containers;

const quantity = 10;


document.addEventListener("DOMContentLoaded", () => {

    const username = document.querySelector("#username").value;
    changeView("all");
    getPosts(numPosts, numPosts + quantity, view, username);

    // Load more posts when scrolled down to bottom of page
    var isFetching = false;
    window.onscroll = () => {
        console.log(isFetching);
        if (!isFetching && window.innerHeight + window.scrollY >= document.body.offsetHeight - 1) {
             isFetching = true;
            getPosts(numPosts, numPosts + quantity, view, username)
                .then(() => {
                    isFetching = false;
                });
        }
    };

    // All Posts button function
    document.querySelector("#allposts").addEventListener("click", () => {
        document.querySelector("#allposts").parentElement.classList.add("active");
        document.querySelector("#following").parentElement.classList.remove("active");
        changeView("all");
        isFetching = false;
        document.querySelector("#page").innerHTML = "All Posts";
    });

    // Following button function
    document.querySelector("#following").addEventListener("click", () => {
        document.querySelector("#allposts").parentElement.classList.remove("active");
        document.querySelector("#following").parentElement.classList.add("active");
        changeView("following");
        isFetching = false;
        document.querySelector("#page").innerHTML = "Following";

        // If view is initally empty, load posts
        if (view.innerHTML === "") {
            getPosts(numPosts, numPosts + quantity, view);
        }
    });


});


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
    body.style.whiteSpace = "pre-wrap";
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
                        originalPost = body.innerHTML;
                        group.remove();
                        createEditButton();
                        return;
                    } else {
                        alert(`Error in changing post, ${response.json().error}`)
                        return;
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


// Function that changes all the global variables that is used to display posts to the user
function changeView(filter) {
    if (filter === "all") {

        view = document.querySelector("#all-view");
        containers = view.getElementsByTagName("container");
        numPosts = numAllPosts;
        view.style.display = "block";
        document.querySelector("#following-view").style.display = "none";

    } else {

        view = document.querySelector("#following-view");
        containers = view.getElementsByTagName("container");
        numPosts = numFollowingPosts;
        view.style.display = "block";
        document.querySelector("#all-view").style.display = "none";

    };
};


function getPosts(start, end, view, username) {

    return new Promise((resolve, reject) => {
        fetch(`/posts?start=${start}&end=${end}&view=${view.id}`)
            .then(response => response.json())
            .then(data => {
                
                // If user not logged in
                if (data.loggedin === false) {
                    if (view.innerHTML === "") {
                        const text = document.createElement("h2");
                        text.classList.add("post-container", "border", "rounded");
                        text.innerHTML = "You must be logged in to use this feature";
                        view.appendChild(text);
                    }
                    return;
                }

                // Update corresponding number of total posts in the view
                if (view.id === "all-view"){
                    numAllPosts += data.posts.length;
                    numPosts = numAllPosts;
                } else {
                    numFollowingPosts += data.posts.length;
                    numPosts = numFollowingPosts;
                };

                // Populate view with posts
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