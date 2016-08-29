@extends('layouts.main')

@section('content')
    <div class="content">
        <div class="title">HTML 5 Video Example</div>
        <br>
        <div id="video_player_container">
        </div>
    </div>
@endsection

@section('scripts')
    <script type="text/babel" src="/js/videoPlayer.js"></script>
@endsection