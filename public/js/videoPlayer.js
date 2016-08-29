(function (React, ReactDOM) {
    /**
     * Individual Clip component containing controls for the clip
     */
    var Clip = React.createClass({
        propTypes: {
            'id': React.PropTypes.any,
            'name': React.PropTypes.string,
            'start_time': React.PropTypes.string,
            'end_time': React.PropTypes.string
        },
        getInitialState: function () {
            return {
                'name': this.props.name,
                'start_time': this.props.start_time,
                'end_time': this.props.end_time
            };
        },
        componentDidMount: function () {
            var id = this.props.id;
            var clipId = "clip_" + this.props.id;

            var clipContainer = document.getElementById(clipId);
            var deleteBtn = clipContainer.getElementsByClassName('delete-clip');
            var playBtn = clipContainer.getElementsByClassName('play-clip');
            var editBtn = clipContainer.getElementsByClassName('edit-clip');

            if (deleteBtn.length) {
                deleteBtn[0].addEventListener('click', function (e) {
                    e.target.disabled = true;
                    document.getElementById('clip_box').dispatchEvent(new CustomEvent('videoClipDeleted', {'detail': {'clipId': id}}));
                });
            }

            if (playBtn.length) {
                playBtn[0].addEventListener('click', this.getClip);
                playBtn[0].addEventListener('selectClip', this.getClip);
            }

            if (editBtn.length) {
                editBtn[0].addEventListener('click', this.setBeingEdited);
                clipContainer.addEventListener('clipEdited', this.editClip);
            }
        },
        componentDidUpdate: function (prevProps, prevState) {
            // If it is now being edited or no longer is, we need to reapply
            // the events to the controls that were rendered
            if (typeof this.state.beingEdited !== 'undefined' && prevState.beingEdited !== this.state.beingEdited) {
                this.componentDidMount();
            }
        },
        /**
         * Marks the clip as being edited, which will render the ClipEditForm
         */
        setBeingEdited: function () {
            var state = this.state;
            state.beingEdited = true;
            this.setState(state);
        },
        /**
         * Event for when a clip is edited and saved
         *
         * @param e
         */
        editClip: function (e) {
            var newClip = e.detail.clip;

            var httpRequest = new XMLHttpRequest();
            var csrfToken = document.querySelector('input[name="_token"]').value;
            var self = this;
            var params = [];

            Object.getOwnPropertyNames(newClip).forEach(function (name) {
                params.push(name + "=" + newClip[name]);
            });

            // Send to the server the updated clip properties
            httpRequest.onreadystatechange = function () {
                if (httpRequest.readyState === XMLHttpRequest.DONE) {
                    if (httpRequest.status === 200) {
                        newClip.beingEdited = false;
                        self.setState(newClip);
                    }
                    else {
                        console.error('Failed to insert new clip');
                    }
                }
            };

            httpRequest.open('POST', '/api/clips/' + newClip.id);
            httpRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            httpRequest.setRequestHeader('X-CSRF-TOKEN', csrfToken);
            httpRequest.send(params.join('&'));
        },
        /**
         * Event to retrieve and play the clip selected
         *
         * @param e
         */
        getClip: function (e) {
            var clipId = e.target.getAttribute('data-clip-id');
            var httpRequest = new XMLHttpRequest();

            // Handle case for the full video
            if (clipId === 0) {
                document.getElementById('video_player')
                    .dispatchEvent(
                        new CustomEvent('playClip', {
                            'detail': {
                                'start_time': "00:00:00"
                            }
                        })
                    );
            }
            else {

                httpRequest.onreadystatechange = function () {
                    if (httpRequest.readyState === XMLHttpRequest.DONE) {
                        if (httpRequest.status === 200) {
                            var response = JSON.parse(httpRequest.responseText);

                            if (response) {
                                // Trigger the video player to play the requested clip
                                document.getElementById('video_player')
                                    .dispatchEvent(
                                        new CustomEvent('playClip', {
                                            'detail': {
                                                'start_time': response.start_time,
                                                'end_time': response.end_time ? response.end_time : undefined
                                            }
                                        })
                                    );

                                // Trigger the Now Playing message to update
                                document.getElementById('clip_box')
                                    .dispatchEvent(new CustomEvent('videoClipNowPlaying', {
                                            'detail': {
                                                'selectedClipId': clipId
                                            }
                                        })
                                    );
                            }
                        }
                        else {
                            console.error('Failed to get clips from the server.  Status ' + httpRequest.status);
                        }
                    }
                };

                httpRequest.open('GET', '/api/clips/' + clipId);
                httpRequest.setRequestHeader('Content-Type', 'application/json');
                httpRequest.send();
            }
        },
        render: function () {

            var deleteBtn = (<a className="button delete-clip" data-clip-id={this.props.id}>Delete</a>);
            var editBtn = (<a className="button edit-clip" data-clip-id={this.props.id}>Edit</a>);
            var playBtn = (
                <a className="button play-clip" data-clip-id={this.props.id}>
                    Play
                </a>
            );
            var editForm = '';

            if (typeof this.props.canBeDeleted !== 'undefined' && !this.props.canBeDeleted) {
                deleteBtn = '';
                editBtn = '';
            }

            if (this.state.beingEdited) {
                // Render the ClipEditForm if this clip is being edited
                editBtn = '';
                playBtn = '';
                deleteBtn = '';
                var clip = this.state;
                clip.id = this.props.id;
                editForm = (<ClipEditForm key={"clipForm_" + clip.id} {...clip}/>)
            }

            return (
                <div id={"clip_" + this.props.id} className="clip">
                    <p>{this.state.name}</p>
                    <div className="controls">
                        {playBtn}
                        {deleteBtn}
                        {editBtn}
                        {editForm}
                    </div>
                </div>
            );
        }
    });

    /**
     * Container component holding all the individual Clip components
     */
    var ClipsBox = React.createClass({
        /**
         * Retrieves a list of all the saved clips in the database
         */
        getClips: function () {
            var httpRequest = new XMLHttpRequest();
            var _this = this;
            var state = this.state;

            httpRequest.onreadystatechange = function () {
                if (httpRequest.readyState === XMLHttpRequest.DONE) {
                    if (httpRequest.status === 200) {
                        var response = JSON.parse(httpRequest.responseText);

                        // Add a full video clip to the list of clips
                        state.clips = [
                            {
                                id: 0,
                                name: 'Full Video',
                                start_time: '00:00:00',
                                canBeDeleted: false
                            }
                        ];
                        state.selectedClipIndex = 0;

                        if (response.length) {
                            state.clips = state.clips.concat(response);
                        }

                        _this.setState(state);
                    }
                    else if (httpRequest.status !== 0) {
                        console.error('Failed to get clips from the server.  Status ' + httpRequest.status);
                    }
                }

            };

            httpRequest.open('GET', '/api/clips');
            httpRequest.setRequestHeader('Content-Type', 'application/json');
            httpRequest.send();
        },
        /**
         * Updates the selectedClipIndex to the clip's index that matches the selectedClipId
         *
         * @param e
         */
        setNowPlaying: function (e) {
            var state = this.state;
            var selectedClipId = e.detail.selectedClipId;

            state.clips.forEach(function (clip, index) {
                if (clip.id == selectedClipId) {
                    state.selectedClipIndex = index;
                }
            });

            this.setState(state);
        },
        /**
         * Plays the previous clip
         */
        previousClip: function () {
            var nextClipIndex = (this.state.selectedClipIndex - 1) < 0
                ? this.state.clips.length - 1
                : (this.state.selectedClipIndex - 1);
            var state = this.state;

            // Trigger the clip to play
            document.getElementById("clip_" + this.state.clips[nextClipIndex].id)
                .getElementsByClassName('play-clip')[0]
                .dispatchEvent(new CustomEvent('selectClip'));

            state.selectedClipIndex = nextClipIndex;
            this.setState(state);
        },
        /**
         * Plays the next clip
         */
        nextClip: function () {
            var nextClipIndex = (this.state.selectedClipIndex + 1) % this.state.clips.length;
            var state = this.state;

            // Trigger the clip to play
            document.getElementById("clip_" + this.state.clips[nextClipIndex].id)
                .getElementsByClassName('play-clip')[0]
                .dispatchEvent(new CustomEvent('selectClip'));

            state.selectedClipIndex = nextClipIndex;
            this.setState(state);
        },
        getInitialState: function () {
            return {'clips': []};
        },
        componentDidUpdate: function () {
            // Make sure the now playing name stays in sync with the component on updates
            if (this.state.clips.length && typeof this.state.selectedClipIndex === 'number') {
                document.getElementById('now_playing_name').innerHTML = this.state.clips[this.state.selectedClipIndex].name;
            }
        },
        componentDidMount: function () {
            this.getClips();

            var clipBox = document.getElementById('clip_box');
            var component = this;

            clipBox.addEventListener('videoClipDeleted', this.deleteClip);
            clipBox.addEventListener('videoClipAdded', this.addClip);
            clipBox.addEventListener('videoClipUpdated', this.updateClip);
            clipBox.addEventListener('videoClipNowPlaying', this.setNowPlaying);

            // Add event listener so press CTRL + Arrow Left goes to the previous clip, and CTRL + Arrow Right goes
            // to the next clip in the clip list
            document.addEventListener('keydown', function (e) {
                if (e.keyCode === 37 && e.ctrlKey === true) {
                    // Left Arrow Key Press
                    component.previousClip();
                }
                else if (e.keyCode === 39 && e.ctrlKey === true) {
                    component.nextClip();
                }
            });
        },
        /**
         * Event used to update the clips in the ClipBox state when a clip is updated
         *
         * @param e
         */
        updateClip: function (e) {
            var editedClip = e.detail.clip;
            var state = this.state;

            if (editedClip.id) {
                state.clips.forEach(function (clip, index) {
                    if (clip.id === editedClip.id) {
                        state.clips[index] = editedClip;
                    }
                });

                this.setState(state);
            }
        },
        /**
         * Event used to add a new clip to the ClipBox clips in the state
         * @param e
         */
        addClip: function (e) {
            var newClip = e.detail.clip;

            // Post the new clip to the server
            var httpRequest = new XMLHttpRequest();
            var csrfToken = document.querySelector('input[name="_token"]').value;
            var self = this;
            var state = this.state;
            var params = [];

            Object.getOwnPropertyNames(newClip).forEach(function (name) {
                params.push(name + "=" + newClip[name]);
            });

            httpRequest.onreadystatechange = function () {
                if (httpRequest.readyState === XMLHttpRequest.DONE) {
                    if (httpRequest.status === 200) {
                        var response = JSON.parse(httpRequest.responseText);
                        
                        if (response && response.id) {
                            // Set the saved clip's id to the new clip data and push it to the clips in the state
                            newClip.id = response.id;
                            state.clips.push(newClip);

                            self.setState(state);
                        }
                    }
                    else {
                        console.error('Failed to insert new clip');
                    }
                }
            };

            httpRequest.open('POST', '/api/clips');
            httpRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            httpRequest.setRequestHeader('X-CSRF-TOKEN', csrfToken);
            httpRequest.send(params.join('&'));
        },
        /**
         * Event that deletes a clip from the ClipBox's clips in the state
         *
         * @param e
         */
        deleteClip: function (e) {
            var deletedClipId = e.detail.clipId;
            var state = this.state;

            state.clips.forEach(function (clip, index) {
                if (clip.id == deletedClipId) {
                    // Remove the clip to be deleted
                    state.clips.splice(index, 1);

                    // If deleting the currently playing clip, set the Full Video to now playing
                    if (state.selectedClipIndex == index) {
                        state.selectedClipIndex = 0;
                    }
                }
            });

            // Send the delete request to the server
            var httpRequest = new XMLHttpRequest();
            var csrfToken = document.querySelector('input[name="_token"]').value;

            httpRequest.onreadystatechange = function () {
                if (httpRequest.readyState === XMLHttpRequest.DONE) {
                    if (httpRequest.status !== 200) {
                        console.error('Failed to delete clip id ' + deletedClipId);
                    }
                }
            };


            httpRequest.open('DELETE', '/api/clips/' + deletedClipId);
            httpRequest.setRequestHeader('Content-Type', 'application/json');
            httpRequest.setRequestHeader('X-CSRF-TOKEN', csrfToken);
            httpRequest.send();

            this.setState(state);
        },
        render: function () {
            return (
                <div id="clip_box" className="video-player-clip-box">
                    <h4>Now Playing: <span id="now_playing_name"></span></h4>
                    <h5>Use CTRL + Arrow Left/Right to play previous or next clip</h5>
                    <h4>Clips:</h4>
                    {
                        this.state.clips.map(function (clip) {
                            return (<Clip key={"clip" + clip.id} id={clip.id} {...clip} />)
                        })
                    }
                </div>
            );
        }
    });

    /**
     * Component used to either edit an existing clip, or create a new one
     */
    var ClipEditForm = React.createClass({
        /**
         * Handles submitting the form, whether editing a clip or creating a new one
         *
         * @param e
         * @returns {boolean}
         */
        handleSubmit: function (e) {
            e.preventDefault();

            var formInputs = e.target.getElementsByTagName('input');

            var newClip = {};

            for (var i = formInputs.length - 1; i >= 0; i--) {
                if (formInputs[i].name && ['id', 'name', 'start_time', 'end_time'].indexOf(formInputs[i].name) !== -1) {
                    if (!formInputs[i].value.trim()) {
                        e.target.getElementsByClassName('error')[0].innerText = 'Please complete the form.';
                        return false;
                    }

                    newClip[formInputs[i].name] = formInputs[i].value;
                }
            }

            if (newClip.id) {
                // Saving an edited clip
                document.getElementById("clip_" + newClip.id)
                    .dispatchEvent(new CustomEvent('clipEdited', {'detail': {'clip': newClip}}));
                document.getElementById('clip_box')
                    .dispatchEvent(new CustomEvent('videoClipUpdated', {'detail': {'clip': newClip}}));
            }
            else {
                // Adding a new clip
                document.getElementById('clip_box')
                    .dispatchEvent(new CustomEvent('videoClipAdded', {'detail': {'clip': newClip}}));
            }

            // Reset the form afterwards
            e.target.getElementsByClassName('error')[0].innerText = '';
            for (var i = formInputs.length - 1; i >= 0; i--) {
                if (formInputs[i].name && ['id', 'name', 'start_time', 'end_time'].indexOf(formInputs[i].name) !== -1) {
                    formInputs[i].value = '';
                }
            }

            return false;
        },
        render: function () {
            var idInput = '';
            var heading = (<h4>Create a new clip</h4>);

            if (this.props.id) {
                idInput = (<input id="clip_id" name="id" type="text" defaultValue={this.props.id} hidden/>);
                heading = '';
            }

            return (
                <form id="new_clip_form" className="new-clip-form" onSubmit={this.handleSubmit}>
                    {heading}
                    {idInput}
                    <p className="error"></p>
                    <div>
                        <label htmlFor="new_clip_name">
                            Clip Name
                        </label>
                        <input id="new_clip_name" name="name" type="text" placeholder="Clip Name"
                               defaultValue={this.props.name}/>
                    </div>
                    <div>
                        <label htmlFor="new_start_time">
                            Start Time
                        </label>
                        <input id="new_start_time" name="start_time" type="text" placeholder="00:00:00"
                               defaultValue={this.props.start_time}/>
                    </div>
                    <div>
                        <label htmlFor="new_end_time">
                            End Time
                        </label>
                        <input id="new_end_time" name="end_time" type="text" placeholder="00:00:00"
                               defaultValue={this.props.end_time}/><br />
                    </div>
                    <div>
                        &nbsp;
                        <input className="button" type="submit" value={this.props.id ? "Save Item" : "Add Clip"}/>
                    </div>
                </form>
            );
        }
    });

    /**
     * Primary component containing the media player
     */
    var VideoPlayerBox = React.createClass({
        /**
         * Event used to play a Clip when selected
         *
         * @param e
         */
        playVideo: function (e) {
            var videoPlayer = document.getElementById('video_player');
            var sources = videoPlayer.getElementsByTagName('source');
            var timeString = "#t=" + e.detail.start_time;

            if (e.detail.end_time) {
                timeString += "," + e.detail.end_time;
            }

            for (var i = sources.length - 1; i >= 0; i--) {
                sources[i].setAttribute('src', sources[i].getAttribute('data-original-src').concat(timeString));
            }

            videoPlayer.load();
            videoPlayer.play();
        },
        componentDidMount: function () {
            document.getElementById('video_player')
                .addEventListener('playClip', this.playVideo);
        },
        render: function () {
            return (
                <div className="video-player-box">
                    <aside>
                        <ClipEditForm key="clipForm_new"/>
                        <ClipsBox key="clipBox"/>
                    </aside>
                    <main>
                        <video id="video_player" controls>
                            <source src="/videos/SampleVideo_720x480.mp4"
                                    data-original-src="/videos/SampleVideo_720x480.mp4"/>
                        </video>
                    </main>
                </div>
            );
        }
    });

    ReactDOM.render(
        <VideoPlayerBox />,
        document.getElementById('video_player_container')
    );

}(React, ReactDOM));