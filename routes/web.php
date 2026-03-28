<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Controllers
|--------------------------------------------------------------------------
*/

use App\Http\Controllers\HomeController;

Route::get('/', [HomeController::class, 'index'])->name('home');

/*
|--------------------------------------------------------------------------
| Authentication Controllers
|--------------------------------------------------------------------------
*/

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Middleware\GuestMiddleware;

Route::get('login', [LoginController::class, 'index'])
    ->middleware(GuestMiddleware::class)
    ->name('auth.login');

Route::post('login', [LoginController::class, 'store'])
    ->name('auth.login.store');

Route::get('logout', [LoginController::class, 'destroy'])
    ->name('auth.logout');

Route::get('register', [RegisterController::class, 'index'])
    ->middleware(GuestMiddleware::class)
    ->name('auth.register');

/*
|--------------------------------------------------------------------------
| Admin Controllers
|--------------------------------------------------------------------------
*/

use App\Http\Middleware\AdminMiddleware;
use App\Http\Controllers\Admin\AdministrationController;
use App\Http\Controllers\Admin\AdminMessageController;
use App\Http\Controllers\Admin\ArchiveController;
use App\Http\Controllers\Admin\CallsController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\DispatchController;
use App\Http\Controllers\Admin\HospitalDirectoryController;
use App\Http\Controllers\Admin\NotificationController;
use App\Http\Controllers\Admin\IncidentManagementController;
use App\Http\Controllers\Admin\IncidentOverviewController;
use App\Http\Controllers\Admin\IncidentReportsController;
use App\Http\Controllers\Admin\IncidentPrintController;
use App\Http\Controllers\Admin\LiveMapController;
use App\Http\Controllers\Admin\PeopleController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\UserEditController;

Route::middleware([AdminMiddleware::class])->group(function () {

    // Dashboard
    Route::get('admin/dashboard', [DashboardController::class, 'index'])->name('admin.dashboard');
    Route::get('admin/dashboard/stats', [DashboardController::class, 'stats'])->name('admin.dashboard.stats');
    Route::patch('admin/incidents/{id}/status', [DashboardController::class, 'updateIncidentStatus'])->name('admin.incidents.updateStatus');
    Route::patch('admin/incidents/{id}/dispatch', [DashboardController::class, 'dispatch'])->name('admin.incidents.dispatch');

    // Dispatch
    Route::get('admin/dispatch/{id}', [DispatchController::class, 'show'])->name('admin.dispatch.show');
    Route::get('admin/incidents/{id}/available-responders', [DispatchController::class, 'getAvailableResponders'])->name('admin.incidents.availableResponders');
    Route::post('admin/dispatch/assign', [DispatchController::class, 'assignResponder'])->name('admin.dispatch.assign');
    Route::post('admin/dispatch/{id}/cancel', [DispatchController::class, 'cancelDispatch'])->name('admin.dispatch.cancel');

    // Live Map
    Route::get('admin/live-map', [LiveMapController::class, 'index'])->name('admin.live-map');
    Route::get('admin/live-map/data', [LiveMapController::class, 'data'])->name('admin.live-map.data');
    Route::get('admin/dispatches/{id}/route-history', [LiveMapController::class, 'getRouteHistory'])->name('admin.dispatch.route-history');

    // Incident Reports
    Route::get('admin/incident-reports', [IncidentReportsController::class, 'index'])->name('admin.incident-reports');
    Route::get('admin/incident-reports/export', [IncidentReportsController::class, 'export'])->name('admin.incident-reports.export');

    // ✅ ADDED PRINT REPORT ROUTE (EXACT POSITION)
    Route::get('admin/incident-reports/print', [IncidentReportsController::class, 'printReport'])
        ->name('admin.incident-reports.print');

    // Incident Overview
    Route::get('admin/incidents/{id}/overview', [IncidentOverviewController::class, 'show'])->name('admin.incidents.overview');

    // ✅ PRINT ROUTE (FIXED LOCATION)
    Route::get('admin/incidents/{id}/print', [IncidentPrintController::class, 'show'])
        ->name('admin.incidents.print');

    // Administration
    Route::get('admin/administration', [AdministrationController::class, 'index'])->name('admin.administration');

    // Notifications
    Route::get('admin/notifications', [NotificationController::class, 'index'])->name('admin.notifications.index');
    Route::get('admin/notifications/unread-count', [NotificationController::class, 'unreadCount'])->name('admin.notifications.unreadCount');
    Route::patch('admin/notifications/{id}/mark-as-read', [NotificationController::class, 'markAsRead'])->name('admin.notifications.markAsRead');
    Route::post('admin/notifications/mark-all-as-read', [NotificationController::class, 'markAllAsRead'])->name('admin.notifications.markAllAsRead');
    Route::delete('admin/notifications/{id}', [NotificationController::class, 'destroy'])->name('admin.notifications.destroy');

    // People
    Route::get('admin/people', [PeopleController::class, 'index'])->name('admin.people');
    Route::get('admin/people/{id}', [PeopleController::class, 'show'])->name('admin.people.show');
    Route::patch('admin/people/{id}/toggle-status', [PeopleController::class, 'toggleStatus'])->name('admin.people.toggleStatus');
    Route::post('admin/people/admin', [PeopleController::class, 'createAdmin'])->name('admin.people.createAdmin');
    Route::delete('admin/people/admin/{id}', [PeopleController::class, 'deleteAdmin'])->name('admin.people.deleteAdmin');
    Route::post('admin/people/responder', [PeopleController::class, 'createResponder'])->name('admin.people.createResponder');
    Route::patch('admin/people/responder/{id}/toggle-status', [PeopleController::class, 'toggleResponderStatus'])->name('admin.people.toggleResponderStatus');

    // Settings
    Route::get('admin/settings', [SettingsController::class, 'index'])->name('admin.settings');
    Route::put('admin/settings/profile', [SettingsController::class, 'updateProfile'])->name('admin.settings.updateProfile');
    Route::put('admin/settings/password', [SettingsController::class, 'updatePassword'])->name('admin.settings.updatePassword');

    // User Edit
    Route::get('admin/user-edit', [UserEditController::class, 'index'])->name('admin.user-edit');
    Route::patch('admin/user-edit/{id}/toggle-status', [UserEditController::class, 'toggleStatus'])->name('admin.user-edit.toggle-status');

    // Chats
    Route::prefix('admin/chats')->group(function () {
        Route::get('/', [AdminMessageController::class, 'index'])->name('admin.chats');
        Route::get('/conversations', [AdminMessageController::class, 'getConversations'])->name('admin.chats.conversations');
        Route::get('/user/{userId}/messages', [AdminMessageController::class, 'getMessages'])->name('admin.chats.messages');
        Route::post('/send', [AdminMessageController::class, 'sendMessage'])->name('admin.chats.send');
        Route::post('/user/{userId}/mark-read', [AdminMessageController::class, 'markConversationAsRead'])->name('admin.chats.markRead');
    });

    // Hospital Directory
    Route::get('admin/hospital-directory', [HospitalDirectoryController::class, 'index'])->name('admin.hospital-directory');

    // Archive
    Route::get('admin/archive', [ArchiveController::class, 'index'])->name('admin.archive');

    // Calls
    Route::prefix('admin/calls')->group(function () {
        Route::get('incoming', [CallsController::class, 'incoming'])->name('admin.calls.incoming');
        Route::post('answer', [CallsController::class, 'answer'])->name('admin.calls.answer');
        Route::post('end', [CallsController::class, 'end'])->name('admin.calls.end');
        Route::post('initiate', [CallsController::class, 'initiateCall'])->name('admin.calls.initiate');
        Route::get('{id}/status', [CallsController::class, 'getCallStatus'])->name('admin.calls.status');
    });

    // Incident Creation
    Route::post('admin/incidents/create', [IncidentManagementController::class, 'store'])->name('admin.incidents.create');
});

/*
|--------------------------------------------------------------------------
| User Controllers
|--------------------------------------------------------------------------
*/

use App\Http\Controllers\User\UserDashboardController;
use App\Http\Controllers\User\UserSettingsController;
use App\Http\Middleware\UserMiddleware;

Route::middleware([UserMiddleware::class])->group(function () {

    Route::get('dashboard', [UserDashboardController::class, 'index'])->name('user.dashboard');

    Route::get('user/settings', [UserSettingsController::class, 'index'])->name('user.settings');
    Route::put('user/settings/profile', [UserSettingsController::class, 'updateProfile'])->name('user.settings.updateProfile');
    Route::put('user/settings/password', [UserSettingsController::class, 'updatePassword'])->name('user.settings.updatePassword');
});