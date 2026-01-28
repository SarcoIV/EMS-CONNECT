<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class AdminAccountCreated extends Mailable
{
    use Queueable, SerializesModels;

    public $adminName;

    public $email;

    public $password;

    public $loginUrl;

    /**
     * Create a new message instance.
     */
    public function __construct(string $adminName, string $email, string $password)
    {
        $this->adminName = $adminName;
        $this->email = $email;
        $this->password = $password;
        $this->loginUrl = config('app.url').'/login';
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->subject('EMS Connect - Your Admin Account Has Been Created')
            ->view('emails.admin-created')
            ->with([
                'adminName' => $this->adminName,
                'email' => $this->email,
                'password' => $this->password,
                'loginUrl' => $this->loginUrl,
            ]);
    }
}
