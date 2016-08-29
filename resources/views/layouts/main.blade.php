<!DOCTYPE html>
<html>
    <head>
        <title>HTML 5 Video Example</title>

        <link href="https://fonts.googleapis.com/css?family=Lato:300" rel="stylesheet" type="text/css">
        <script src="/js/react.js"></script>
        <script src="/js/react-dom.js"></script>
        <script src="/js/browser.min.js"></script>
        <link href="/css/style.css" rel="stylesheet" type="text/css">
    </head>
    <body>
        <div class="container">
            @yield('content')
        </div>

        @yield('scripts')
        {{csrf_field()}}
    </body>
</html>
