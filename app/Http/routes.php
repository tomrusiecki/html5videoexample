<?php

/*
|--------------------------------------------------------------------------
| Application Routes
|--------------------------------------------------------------------------
|
| Here is where you can register all of the routes for an application.
| It's a breeze. Simply tell Laravel the URIs it should respond to
| and give it the controller to call when that URI is requested.
|
*/

Route::get('/', function () {
    return view('home');
});

Route::group(['prefix' => '/api'], function () {
    Route::group(['prefix' => '/clips'], function () {
       Route::get('/{clipId?}', 'ClipsController@get');
       Route::post('', 'ClipsController@upsert');
       Route::post('/{clipId}', 'ClipsController@upsert');
       Route::delete('/{clipId}', 'ClipsController@delete');
    });
});