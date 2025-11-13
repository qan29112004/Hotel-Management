# Generic Components Usage Guide

This guide explains how to use the generic components (Add, Edit, Delete, Filter) for different management screens.

## Components Overview

### 1. GenericAddComponent
- **Purpose**: Create new items with configurable form fields
- **Location**: `fe/src/app/shared/components/generic-add/`

### 2. GenericEditComponent  
- **Purpose**: Edit existing items with configurable form fields
- **Location**: `fe/src/app/shared/components/generic-edit/`

### 3. GenericDeleteComponent
- **Purpose**: Delete single or multiple items with confirmation
- **Location**: `fe/src/app/shared/components/generic-delete/`

### 4. GenericFilterComponent
- **Purpose**: Filter data with configurable filter fields
- **Location**: `fe/src/app/shared/components/generic-filter/`

## Example: Destination Management

### Step 1: Import Components

```typescript
import { GenericAddComponent } from 'app/shared/components/generic-add/generic-add.component';
import { GenericEditComponent } from 'app/shared/components/generic-edit/generic-edit.component';
import { GenericDeleteComponent } from 'app/shared/components/generic-delete/generic-delete.component';
import { GenericFilterComponent } from 'app/shared/components/generic-filter/generic-filter.component';
```

### Step 2: Configure Add Component

```typescript
// In your component
destinationAddConfig: GenericAddConfig = {
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
```

### Step 3: Configure Edit Component

```typescript
destinationEditConfig: GenericEditConfig = {
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
  getItemSubject: this.destinationService.selectedDestination$,
  successMessage: 'Destination updated successfully'
};
```

### Step 4: Configure Delete Component

```typescript
destinationDeleteConfig: GenericDeleteConfig = {
  title: 'Delete Destination',
  message: 'Are you sure you want to delete this destination?',
  service: this.destinationService,
  deleteMethod: 'deleteDestination',
  getItemName: (item) => item.name,
  getItemId: (item) => ({ uuid: item.uuid }),
  successMessage: 'Destination deleted successfully'
};
```

### Step 5: Configure Filter Component

```typescript
destinationFilterConfig: GenericFilterConfig = {
  title: 'Filter Destinations',
  fields: [
    {
      key: 'name',
      label: 'Name',
      type: 'text',
      placeholder: 'Search by name'
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ]
    },
    {
      key: 'created_at',
      label: 'Created Date',
      type: 'dateRange'
    }
  ]
};
```

### Step 6: Use in Template

```html
<!-- Add Component -->
<app-generic-add
  [showAdd]="showAddDestination"
  [config]="destinationAddConfig"
  (toggleAddDrawer)="toggleAddDestination()"
  (onSuccess)="onDestinationCreated($event)">
</app-generic-add>

<!-- Edit Component -->
<app-generic-edit
  [showEdit]="showEditDestination"
  [config]="destinationEditConfig"
  (toggleEditDrawer)="toggleEditDestination()"
  (onSuccess)="onDestinationUpdated($event)">
</app-generic-edit>

<!-- Delete Component -->
<app-generic-delete
  [item]="selectedDestination"
  [config]="destinationDeleteConfig"
  [showModal]="showDeleteDestination"
  (close)="toggleDeleteDestination()"
  (onSuccess)="onDestinationDeleted($event)">
</app-generic-delete>

<!-- Filter Component -->
<app-generic-filter
  [mode]="'inline'"
  [config]="destinationFilterConfig"
  (filter)="onDestinationFilter($event)"
  (reset)="onDestinationFilterReset()">
</app-generic-filter>
```

## Field Types Supported

### Form Fields (Add/Edit)
- `text` - Text input
- `email` - Email input with validation
- `password` - Password input with visibility toggle
- `number` - Number input
- `date` - Date picker
- `select` - Dropdown select
- `textarea` - Multi-line text
- `checkbox` - Checkbox input
- `radio` - Radio button group

### Filter Fields
- `text` - Text search
- `select` - Dropdown filter
- `date` - Date filter
- `dateRange` - Date range filter
- `autocomplete` - Autocomplete search
- `number` - Number filter
- `checkbox` - Boolean filter

## Advanced Features

### Conditional Fields
```typescript
{
  key: 'address',
  label: 'Address',
  type: 'text',
  dependsOn: 'hasAddress',
  dependsOnValue: true
}
```

### Dynamic Options
```typescript
{
  key: 'category',
  label: 'Category',
  type: 'select',
  dataSource: () => this.getCategories()
}
```

### Custom Validation
```typescript
{
  key: 'email',
  label: 'Email',
  type: 'email',
  validators: [Validators.required, Validators.email, customValidator]
}
```

### Data Transformation
```typescript
// In config
transformData: (data) => ({
  ...data,
  created_at: new Date().toISOString()
})
```

## Benefits

1. **Consistency**: Same UI/UX across all management screens
2. **Reusability**: One component for all CRUD operations
3. **Maintainability**: Centralized logic and styling
4. **Flexibility**: Configurable fields and validation
5. **Type Safety**: Full TypeScript support
6. **Performance**: Optimized rendering and state management
