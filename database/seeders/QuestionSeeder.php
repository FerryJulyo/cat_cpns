<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Question;

class QuestionSeeder extends Seeder
{
    public function run()
    {
        $questions = [
            [
                'category' => 'TWK',
                'question' => 'Pancasila sebagai dasar negara Indonesia ditetapkan pada tanggal?',
                'options' => [
                    '17 Agustus 1945',
                    '18 Agustus 1945',
                    '1 Juni 1945',
                    '22 Juni 1945'
                ],
                'correct_answer' => 1
            ],
            [
                'category' => 'TWK',
                'question' => 'Siapa presiden pertama Republik Indonesia?',
                'options' => [
                    'Soeharto',
                    'Ir. Soekarno',
                    'B.J. Habibie',
                    'Megawati Soekarnoputri'
                ],
                'correct_answer' => 1
            ],
            [
                'category' => 'TIU',
                'question' => 'Jika A = 2, B = 4, C = 6, maka nilai A + B × C adalah?',
                'options' => ['26', '28', '32', '36'],
                'correct_answer' => 0
            ],
            [
                'category' => 'TIU',
                'question' => 'Lanjutkan deret: 2, 4, 8, 16, ...',
                'options' => ['24', '28', '32', '36'],
                'correct_answer' => 2
            ],
            [
                'category' => 'TKP',
                'question' => 'Anda menemukan rekan kerja melakukan kesalahan. Apa yang akan Anda lakukan?',
                'options' => [
                    'Membiarkannya karena bukan urusan saya',
                    'Melaporkan langsung ke atasan',
                    'Mengingatkan dengan baik dan membantu memperbaiki',
                    'Menyebarkan ke rekan lain'
                ],
                'correct_answer' => 2
            ],
            [
                'category' => 'TKP',
                'question' => 'Ketika menghadapi deadline yang ketat, sikap Anda adalah?',
                'options' => [
                    'Panik dan menyerah',
                    'Menyalahkan orang lain',
                    'Membuat prioritas dan bekerja fokus',
                    'Menunda-nunda pekerjaan'
                ],
                'correct_answer' => 2
            ],
            [
                'category' => 'TWK',
                'question' => 'UUD 1945 disahkan pada tanggal?',
                'options' => [
                    '17 Agustus 1945',
                    '18 Agustus 1945',
                    '19 Agustus 1945',
                    '20 Agustus 1945'
                ],
                'correct_answer' => 1
            ],
            [
                'category' => 'TIU',
                'question' => 'Berapa hasil dari 15% dari 200?',
                'options' => ['25', '30', '35', '40'],
                'correct_answer' => 1
            ],
            [
                'category' => 'TIU',
                'question' => 'Sinonim kata "PRESTASI" adalah?',
                'options' => ['Kegagalan', 'Pencapaian', 'Kesalahan', 'Kemalasan'],
                'correct_answer' => 1
            ],
            [
                'category' => 'TKP',
                'question' => 'Anda diminta memimpin tim baru. Langkah pertama Anda adalah?',
                'options' => [
                    'Langsung memberi perintah',
                    'Mengenal anggota tim dan kompetensinya',
                    'Membiarkan tim bekerja sendiri',
                    'Mengkritik kinerja sebelumnya'
                ],
                'correct_answer' => 1
            ],
        ];

        foreach ($questions as $question) {
            Question::create($question);
        }
    }
}