<?php namespace App\Http\Controllers;
use App\Clip;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Requests;

/**
 * Class ClipsController
 * @package App\Http\Controllers
 */
class ClipsController extends Controller
{
    /**
     * Gets an individual clip if the clipId is given, otherwise returns all clips
     * 
     * @param Request $request
     * @param null $clipId
     * @return \Symfony\Component\HttpFoundation\Response|static
     */
    public function get(Request $request, $clipId = null)
    {
        if ($clipId)
        {
            $clips = Clip::find($clipId);

            if (!$clips)
            {
                abort(404);
            }
        }
        else
        {
            $clips = Clip::all();
        }

        return JsonResponse::create($clips);
    }

    /**
     * Deletes the clip given by the clipId
     * 
     * @param Request $request
     * @param $clipId
     * @return \Symfony\Component\HttpFoundation\Response|static
     */
    public function delete(Request $request, $clipId)
    {
        $clip = Clip::find($clipId);

        if (!$clip)
        {
            abort(404);
        }

        $clip->delete();

        return JsonResponse::create();
    }

    /**
     * Inserts a new clip if clipId is not given.  Otherwise, will update the given clipId.
     * 
     * @param Request $request
     * @param null $clipId
     * @return \Symfony\Component\HttpFoundation\Response|static
     */
    public function upsert(Request $request, $clipId = null)
    {
        if ($clipId)
        {
            $clip = Clip::find($clipId);

            if (!$clip)
            {
                abort(404);
            }
        }
        else
        {
            $clip = new Clip();
        }

        $clip->name = $request->request->get('name', 'null');
        $clip->start_time = $request->request->get('start_time');
        $clip->end_time = $request->request->get('end_time');

        $clip->save();

        return JsonResponse::create(['id' => $clip->id]);
    }
}
