// Example implementation for Destination Management using Generic Components

import { Component, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DestinationService } from 'app/core/admin/destination/destination.service';
import { Destination } from 'app/core/admin/destination/destination.type';

// Import generic components
import { 
    GenericAddComponent, 
    GenericAddConfig, 
    FormFieldConfig 
} from '../generic-add/generic-add.component';
import { 
    GenericEditComponent, 
    GenericEditConfig 
} from '../generic-edit/generic-edit.component';
import { 
    GenericDeleteComponent, 
    GenericDeleteConfig, 
    DeleteItem 
} from '../generic-delete/generic-delete.component';
import { 
    GenericFilterComponent, 
    GenericFilterConfig, 
    FilterFieldConfig 
} from '../generic-filter/generic-filter.component';

@Component({
    selector: 'app-destination-management-example',
    standalone: true,
    imports: [
        GenericAddComponent,
        GenericEditComponent,
        GenericDeleteComponent,
        GenericFilterComponent
    ],
    template: `
        <div class="destination-management">
            <!-- Filter Component -->
            <app-generic-filter
                [mode]="'inline'"
                [config]="filterConfig"
                (filter)="onFilterApplied($event)"
                (reset)="onFilterReset()">
            </app-generic-filter>

            <!-- Action Buttons -->
            <div class="actions mb-4">
                <button mat-flat-button color="primary" (click)="showAddForm()">
                    <mat-icon>add</mat-icon>
                    Add Destination
                </button>
            </div>

            <!-- Destinations List -->
            <div class="destinations-list">
                <mat-card *ngFor="let destination of destinations" class="destination-card">
                    <mat-card-content>
                        <h3>{{ destination.name }}</h3>
                        <p>{{ destination.description }}</p>
                        <div class="actions">
                            <button mat-icon-button (click)="editDestination(destination)">
                                <mat-icon>edit</mat-icon>
                            </button>
                            <button mat-icon-button color="warn" (click)="deleteDestination(destination)">
                                <mat-icon>delete</mat-icon>
                            </button>
                        </div>
                    </mat-card-content>
                </mat-card>
            </div>

            <!-- Add Component -->
            <app-generic-add
                [showAdd]="showAdd"
                [config]="addConfig"
                (toggleAddDrawer)="toggleAddForm()"
                (onSuccess)="onDestinationCreated($event)">
            </app-generic-add>

            <!-- Edit Component -->
            <app-generic-edit
                [showEdit]="showEdit"
                [config]="editConfig"
                (toggleEditDrawer)="toggleEditForm()"
                (onSuccess)="onDestinationUpdated($event)">
            </app-generic-edit>

            <!-- Delete Component -->
            <app-generic-delete
                [item]="selectedDestination"
                [config]="deleteConfig"
                [showModal]="showDelete"
                (close)="toggleDeleteForm()"
                (onSuccess)="onDestinationDeleted($event)">
            </app-generic-delete>
        </div>
    `
})
export class DestinationManagementExampleComponent implements OnInit {
    // State
    destinations: Destination[] = [];
    selectedDestination: Destination | null = null;
    
    // UI State
    showAdd = false;
    showEdit = false;
    showDelete = false;

    // Subject for selected destination (used by edit component)
    selectedDestinationSubject = new BehaviorSubject<Destination | null>(null);

    constructor(private destinationService: DestinationService) {}

    ngOnInit(): void {
        this.loadDestinations();
    }

    // Configuration for Add Component
    addConfig: GenericAddConfig = {
        title: 'Add New Destination',
        fields: [
            {
                key: 'name',
                label: 'Destination Name',
                type: 'text',
                required: true,
                placeholder: 'Enter destination name'
            },
            {
                key: 'description',
                label: 'Description',
                type: 'textarea',
                placeholder: 'Enter destination description'
            }
        ],
        service: this.destinationService,
        createMethod: 'createDestination',
        successMessage: 'Destination created successfully'
    };

    // Configuration for Edit Component
    editConfig: GenericEditConfig = {
        title: 'Edit Destination',
        fields: [
            {
                key: 'name',
                label: 'Destination Name',
                type: 'text',
                required: true,
                editable: true
            },
            {
                key: 'description',
                label: 'Description',
                type: 'textarea',
                editable: true
            }
        ],
        service: this.destinationService,
        updateMethod: 'updateDestination',
        getItemSubject: this.selectedDestinationSubject,
        successMessage: 'Destination updated successfully'
    };

    // Configuration for Delete Component
    deleteConfig: GenericDeleteConfig = {
        title: 'Delete Destination',
        message: 'Are you sure you want to delete this destination?',
        service: this.destinationService,
        deleteMethod: 'deleteDestination',
        getItemName: (item) => item.name,
        getItemId: (item) => ({ uuid: item.uuid }),
        successMessage: 'Destination deleted successfully'
    };

    // Configuration for Filter Component
    filterConfig: GenericFilterConfig = {
        title: 'Filter Destinations',
        fields: [
            {
                key: 'name',
                label: 'Name',
                type: 'text',
                placeholder: 'Search by name'
            },
            {
                key: 'description',
                label: 'Description',
                type: 'text',
                placeholder: 'Search by description'
            }
        ]
    };

    // Methods
    loadDestinations(): void {
        this.destinationService.getDestinations().subscribe({
            next: (response) => {
                this.destinations = response.data || [];
            },
            error: (error) => {
                console.error('Error loading destinations:', error);
            }
        });
    }

    // Add Form Methods
    showAddForm(): void {
        this.showAdd = true;
    }

    toggleAddForm(): void {
        this.showAdd = !this.showAdd;
    }

    onDestinationCreated(result: any): void {
        this.loadDestinations();
        this.showAdd = false;
    }

    // Edit Form Methods
    editDestination(destination: Destination): void {
        this.selectedDestination = destination;
        this.selectedDestinationSubject.next(destination);
        this.showEdit = true;
    }

    toggleEditForm(): void {
        this.showEdit = !this.showEdit;
        if (!this.showEdit) {
            this.selectedDestination = null;
            this.selectedDestinationSubject.next(null);
        }
    }

    onDestinationUpdated(result: any): void {
        this.loadDestinations();
        this.showEdit = false;
        this.selectedDestination = null;
        this.selectedDestinationSubject.next(null);
    }

    // Delete Form Methods
    deleteDestination(destination: Destination): void {
        this.selectedDestination = destination;
        this.showDelete = true;
    }

    toggleDeleteForm(): void {
        this.showDelete = !this.showDelete;
        if (!this.showDelete) {
            this.selectedDestination = null;
        }
    }

    onDestinationDeleted(result: any): void {
        this.loadDestinations();
        this.showDelete = false;
        this.selectedDestination = null;
    }

    // Filter Methods
    onFilterApplied(filters: any[]): void {
        console.log('Applied filters:', filters);
        // Apply filters to your data loading logic
        // You might want to pass filters to your service method
        this.destinationService.getDestinations({ filters }).subscribe({
            next: (response) => {
                this.destinations = response.data || [];
            },
            error: (error) => {
                console.error('Error loading filtered destinations:', error);
            }
        });
    }

    onFilterReset(): void {
        console.log('Filters reset');
        this.loadDestinations();
    }
}

// Example for Hotel Management (showing different field types)
export class HotelManagementExampleComponent implements OnInit {
    // Configuration for Hotel Add Component
    hotelAddConfig: GenericAddConfig = {
        title: 'Add New Hotel',
        fields: [
            {
                key: 'name',
                label: 'Hotel Name',
                type: 'text',
                required: true,
                placeholder: 'Enter hotel name'
            },
            {
                key: 'description',
                label: 'Description',
                type: 'textarea',
                placeholder: 'Enter hotel description'
            },
            {
                key: 'destination',
                label: 'Destination',
                type: 'select',
                required: true,
                options: [
                    { value: 'dest1', label: 'Destination 1' },
                    { value: 'dest2', label: 'Destination 2' }
                ]
            },
            {
                key: 'phone',
                label: 'Phone',
                type: 'text',
                required: true,
                placeholder: 'Enter phone number'
            },
            {
                key: 'email',
                label: 'Email',
                type: 'email',
                required: true,
                placeholder: 'Enter email address'
            },
            {
                key: 'address',
                label: 'Address',
                type: 'textarea',
                placeholder: 'Enter hotel address'
            },
            {
                key: 'status',
                label: 'Status',
                type: 'select',
                required: true,
                options: [
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' },
                    { value: 'maintenance', label: 'Under Maintenance' }
                ]
            },
            {
                key: 'hasWifi',
                label: 'Has WiFi',
                type: 'checkbox',
                defaultValue: false
            },
            {
                key: 'rating',
                label: 'Rating',
                type: 'select',
                options: [
                    { value: 1, label: '1 Star' },
                    { value: 2, label: '2 Stars' },
                    { value: 3, label: '3 Stars' },
                    { value: 4, label: '4 Stars' },
                    { value: 5, label: '5 Stars' }
                ]
            }
        ],
        service: this.hotelService, // Assuming you have a hotel service
        createMethod: 'createHotel',
        successMessage: 'Hotel created successfully',
        transformData: (data) => ({
            ...data,
            created_at: new Date().toISOString(),
            slug: data.name.toLowerCase().replace(/\s+/g, '-')
        })
    };

    // Configuration for Hotel Filter Component
    hotelFilterConfig: GenericFilterConfig = {
        title: 'Filter Hotels',
        fields: [
            {
                key: 'name',
                label: 'Hotel Name',
                type: 'text',
                placeholder: 'Search by name'
            },
            {
                key: 'destination',
                label: 'Destination',
                type: 'select',
                options: [
                    { value: 'dest1', label: 'Destination 1' },
                    { value: 'dest2', label: 'Destination 2' }
                ]
            },
            {
                key: 'status',
                label: 'Status',
                type: 'select',
                multiple: true,
                options: [
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' },
                    { value: 'maintenance', label: 'Under Maintenance' }
                ]
            },
            {
                key: 'rating',
                label: 'Rating',
                type: 'select',
                options: [
                    { value: 5, label: '5 Stars' },
                    { value: 4, label: '4 Stars' },
                    { value: 3, label: '3 Stars' },
                    { value: 2, label: '2 Stars' },
                    { value: 1, label: '1 Star' }
                ]
            },
            {
                key: 'hasWifi',
                label: 'Has WiFi',
                type: 'checkbox'
            },
            {
                key: 'created_at',
                label: 'Created Date',
                type: 'dateRange'
            }
        ]
    };

    constructor(private hotelService: any) {} // Replace with actual hotel service

    ngOnInit(): void {
        // Initialize component
    }
}
