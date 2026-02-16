# System-Generated Organization Setup Todo

## Overview
This feature automatically creates a one-time, high-priority todo for admin users when their organization profile is incomplete.

## How It Works

### Trigger Point
- Runs automatically on **every login** (non-blocking, async)
- Only creates the todo **once** per tenant
- Checks if setup todo already exists before creating

### What It Checks
The system examines the following organization fields:
1. **Tagline** - Company tagline/slogan
2. **About Us** - Company description
3. **Terms of Service** - Service terms and conditions
4. **Payment Terms** - Payment policies
5. **Deliverables** - List of deliverables provided
6. **Add-ons/Services** - Additional services offered
7. **Contact Email** - Primary contact email
8. **Contact Phone** - Primary contact phone
9. **Address** - Business address

### Todo Creation Logic
1. **Skip if complete**: If all fields are filled, no todo is created
2. **Skip if exists**: If setup todo already exists, don't create duplicate
3. **Create if incomplete**: Lists all missing fields in a single todo

### Todo Properties
```typescript
{
  description: "Complete Organization Setup: Add Tagline, About Us, Terms of Service, Payment Terms",
  priority: "high",
  redirectUrl: "/settings/organization",
  addedBy: "system",
  isDone: false
}
```

### Who Gets The Todo
- All **active admin users** in the tenant
- Each admin gets their own copy of the todo

## Implementation Files

### Backend
- **Job**: `/api/services/src/jobs/checkOrganizationSetup.ts`
  - Contains the main logic for checking and creating todos
  
- **Controller**: `/api/services/src/controllers/authController.ts`
  - Triggers the check after successful login (line ~164)
  - Runs asynchronously without blocking login response

### Models Used
- `Organization` - To check completion status
- `Todo` - To create the todo
- `User` - To find admin users
- `Role` - To identify admin role

## Example Scenarios

### Scenario 1: New User First Login
```
User signs up → Logs in → Organization has no data
→ System creates high-priority todo:
   "Complete Organization Setup: Add Tagline, About Us, Terms of Service, Payment Terms, Deliverables, Add-ons/Services, Contact Email, Contact Phone, Address"
```

### Scenario 2: Partially Complete Profile
```
User has filled: Company Name, Tagline, About Us, Contact Email
Missing: Terms of Service, Payment Terms, Deliverables, Add-ons, Phone, Address
→ System creates todo:
   "Complete Organization Setup: Add Terms of Service, Payment Terms, Deliverables, Add-ons/Services, Contact Phone, Address"
```

### Scenario 3: Complete Profile
```
All organization fields filled
→ No todo created
→ User has clean dashboard
```

### Scenario 4: Subsequent Logins
```
First login: Todo created
Second login: System detects existing todo, skips creation
→ No duplicate todos
```

## Benefits

1. **Onboarding Helper**: Guides new users to complete their profile
2. **No Duplicates**: Checks for existing setup todos before creating
3. **Single Todo**: All missing fields listed in one todo, not multiple
4. **Non-Intrusive**: Runs in background, doesn't slow down login
5. **Smart Priority**: High priority so admins notice it
6. **Direct Link**: Redirects to organization settings page
7. **System-Managed**: Marked as `addedBy: 'system'` for tracking

## Future Enhancements

Potential improvements:
- Auto-complete the todo when all fields are filled
- Send email reminder if todo pending for 7+ days
- Add progress percentage (e.g., "5 of 9 fields complete")
- Allow users to dismiss/snooze the todo
- Track completion time in analytics

## Monitoring

Check logs for:
```
[ORG_SETUP] Organization setup complete for tenant: xxx
[ORG_SETUP] Created organization setup todo for 2 admin(s) in tenant: xxx
[ORG_SETUP] Missing fields: Tagline, Terms of Service, Deliverables
```
