# HTML 5 Video Example

An example application that allows a user to slice up a video into clips.

Frontend: ReactJS
Backend: PHP and MYSQL, using Laravel 5.2

Features:
* An HTML5 video player that utilizes media fragments
* A list of clips to be played in the video player (first/default clip is the full video)
* An interface to add a new video clip specifying start time, end time, and name
* The ability to play clips in the video player
* Clip data should be saved to a database and retrieved via RESTful APIs

Optional Features included:
* The ability to delete clips from the list
* The ability to edit existing clips in the list
* Hotkeys to jump between the current clip and next and previous clips (if there are any)

For implementing tagging, I would create a table for the tags and use a many-to-many table to link clips to tags.  Then
the endpoint would need to account for creating new tags, removing/adding tags on a clip, and deleting tags when there
are no longer any clips attached to the tag.

## To run the project locally:

1. Pull the master branch
2. Edit the .env file to use the correct database credentials in MySQL on your local instance.
3. Run "php composer.phar install"
4. Run "php artisan migrate --seed"
5. Navigate to /

Test video from www.sample-videos.com

-- Tom Rusiecki