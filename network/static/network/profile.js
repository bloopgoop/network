document.addEventListener('DOMContentLoaded', () => {
    
    username = document.querySelector('#username').value;
    console.log(username)

    
    // Check if following already
    fetch(`/follow?check=1&user=${username}`)
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



    // Button function
    document.querySelector('#follow').addEventListener('click', () => {

        // Check if following
        fetch(`/follow?check=1&user=${username}`)
            .then(response => response.json())
            .then(data => {

                if (data.following) {
                    
                    // Unfollow
                    fetch(`/follow?check=0&user=${username}&unfollow=1`)
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`Error! status: ${response.status}`);
                            } else {
                                // Change button
                                follow.innerHTML = 'Follow';
                                follow.classList.add('btn-primary');
                                follow.classList.remove('btn-outline-primary');

                                // Change following number
                                var followers = document.querySelector('#followers');
                                var numFollowers = followers.innerHTML;
                                numFollowers--;
                                followers.innerHTML = numFollowers;
                            }
                        })
                        .catch(error => {
                            console.log(`Problem with fetch: ${error.message}`);
                        });

                } else {

                    // Follow
                    fetch(`/follow?check=0&user=${username}&follow=1`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Error! status: ${response.status}`);
                        } else {
                            // Change button
                            follow.innerHTML = 'Unfollow';
                            follow.classList.remove('btn-primary');
                            follow.classList.add('btn-outline-primary');

                            // Change following number
                            var followers = document.querySelector('#followers');
                            var numFollowers = followers.innerHTML;
                            numFollowers++;
                            followers.innerHTML = numFollowers;
                        }
                    })
                    .catch(error => {
                        console.log(`Problem with fetch: ${error.message}`);
                    });

                };

            })

    });


})