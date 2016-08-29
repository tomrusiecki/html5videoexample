<?php

use Illuminate\Database\Seeder;
use App\Clip;

class ClipSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $newClips = [
            [
                'name' => 'Clip A',
                'start_time' => 5,
                'end_time' => 20
            ],
            [
                'name' => 'Clip B',
                'start_time' => 18,
                'end_time' => 40
            ],
            [
                'name' => 'Clip C',
                'start_time' => 17,
                'end_time' => 35
            ]
        ];

        foreach ($newClips as $clipData)
        {
            $clip = new Clip();

            $clip->name = $clipData['name'];
            $clip->start_time = $clipData['start_time'];
            $clip->end_time = $clipData['end_time'];

            $clip->save();
        }
    }
}
