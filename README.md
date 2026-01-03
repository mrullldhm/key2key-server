# Key2Key API Documentation

**Base URL:** `http://localhost:{PORT}/api/v1`

**Authentication:** All endpoints except auth routes require a valid JWT Bearer token in the `Authorization` header.

---

## Table of Contents

1. [Authentication Routes](#authentication-routes)
2. [Credential Routes](#credential-routes)
3. [Share Routes](#share-routes)
4. [Error Responses](#error-responses)

---

## Authentication Routes

### POST /auth/sign-up

**Description:** Register a new user account with email and password.

**Headers:**

```
Content-Type: application/json
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (201 - Created):**

```json
{
  "success": true,
  "message": "User sign-up successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "password": "hashedPassword",
      "vaultKeySalt": "saltValue",
      "publicKey": "publicKeyValue",
      "privateKey": "encryptedPrivateKeyValue",
      "createdAt": "2025-01-04T10:00:00Z",
      "updatedAt": "2025-01-04T10:00:00Z"
    }
  }
}
```

**Error Responses:**

| Status | Error              | Description                 |
| ------ | ------------------ | --------------------------- |
| 409    | User already exist | Email is already registered |
| 500    | Server Error       | Unexpected server error     |

**Validation:**

- `email`: Required, must be unique, valid email format
- `password`: Required, minimum 8 characters recommended

**Notes:**

- JWT token is generated with expiration set by `JWT_EXPIRES_IN` env variable
- Cryptographic keys (publicKey, privateKey, vaultKeySalt) are generated for end-to-end encryption
- Password is hashed using bcrypt with salt factor of 10

---

### POST /auth/sign-in

**Description:** Authenticate user and retrieve JWT token along with user credentials and cryptographic keys.

**Headers:**

```
Content-Type: application/json
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (201 - Created):**

```json
{
  "success": true,
  "message": "User sign-in successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "vaultKeySalt": "saltValue",
      "publicKey": "publicKeyValue",
      "privateKey": "encryptedPrivateKeyValue"
    }
  }
}
```

**Error Responses:**

| Status | Error          | Description                       |
| ------ | -------------- | --------------------------------- |
| 404    | User not found | No account exists with this email |
| 401    | Unauthorized   | Password is incorrect             |
| 500    | Server Error   | Unexpected server error           |

**Validation:**

- `email`: Required, valid email format
- `password`: Required, must match stored password

**Notes:**

- Cryptographic keys needed for local decryption are returned
- Token must be included in subsequent authenticated requests
- JWT tokens expire based on `JWT_EXPIRES_IN` configuration

---

### POST /auth/sign-out

**Description:** Sign out user and clear authentication session.

**Headers:**

```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**

```json
{}
```

**Response (200 - OK):**

```json
{
  "success": true,
  "message": "User sign-out successfully"
}
```

**Error Responses:**

| Status | Error        | Description             |
| ------ | ------------ | ----------------------- |
| 500    | Server Error | Unexpected server error |

**Notes:**

- Clears authentication cookie on the server side
- Client should discard the JWT token
- No authentication required

---

## Credential Routes

**Base Path:** `/credential`

**Authentication:** ✅ Required for all endpoints (Bearer token)

---

### GET /credential

**Description:** Retrieve all credentials and shared credentials for the authenticated user (full vault).

**Headers:**

```
Authorization: Bearer {token}
Content-Type: application/json
```

**Query Parameters:** None

**Response (200 - OK):**

```json
{
  "success": true,
  "message": "Vault retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "userId": "ownerUserId",
      "credentialId": "uuid",
      "encryptedDataKey": "encryptedDataKeyValue",
      "iv": "initializationVector",
      "createdAt": "2025-01-04T10:00:00Z",
      "updatedAt": "2025-01-04T10:00:00Z",
      "credential": {
        "id": "uuid",
        "userId": "ownerUserId",
        "title": "Gmail Account",
        "logInUrl": "https://accounts.google.com",
        "notes": "Personal Gmail",
        "encryptedUsername": "encryptedValue",
        "encryptedPassword": "encryptedValue",
        "iv": "initializationVector",
        "tag": "tag_value",
        "favorite": true,
        "folderId": "uuid or null",
        "createdAt": "2025-01-04T10:00:00Z",
        "updatedAt": "2025-01-04T10:00:00Z",
        "folder": {
          "id": "uuid",
          "name": "Email Accounts",
          "userId": "ownerUserId"
        }
      }
    }
  ]
}
```

**Error Responses:**

| Status | Error        | Description                  |
| ------ | ------------ | ---------------------------- |
| 401    | Unauthorized | Invalid or missing JWT token |
| 500    | Server Error | Unexpected server error      |

**Notes:**

- Returns both owned credentials and shared credentials
- Includes encrypted data (decryption happens on frontend)
- Includes associated folder information
- Sorted by creation date (descending)

---

### GET /credential/:id

**Description:** Retrieve a specific credential by ID (only if user has permission).

**Headers:**

```
Authorization: Bearer {token}
Content-Type: application/json
```

**URL Parameters:**

- `id` (required): UUID of the credential to retrieve

**Response (200 - OK):**

```json
{
  "success": true,
  "message": "Credential retrieved successfully",
  "data": {
    "id": "uuid",
    "userId": "currentUserId",
    "credentialId": "uuid",
    "encryptedDataKey": "encryptedDataKeyValue",
    "iv": "initializationVector",
    "credential": {
      "id": "uuid",
      "userId": "ownerUserId",
      "title": "Gmail Account",
      "logInUrl": "https://accounts.google.com",
      "notes": "Personal Gmail",
      "encryptedUsername": "encryptedValue",
      "encryptedPassword": "encryptedValue",
      "iv": "initializationVector",
      "tag": "tag_value",
      "favorite": true,
      "folderId": "uuid or null",
      "folder": {}
    }
  }
}
```

**Error Responses:**

| Status | Error                                 | Description                                        |
| ------ | ------------------------------------- | -------------------------------------------------- |
| 404    | Credential not found or access denied | Credential doesn't exist or user has no permission |
| 401    | Unauthorized                          | Invalid or missing JWT token                       |
| 500    | Server Error                          | Unexpected server error                            |

**Notes:**

- User must have permission (ownership or share) to access
- Returns decryption key encrypted with user's private key

---

### POST /credential

**Description:** Create a new credential entry and establish permission record.

**Headers:**

```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**

```json
{
  "title": "Gmail Account",
  "logInUrl": "https://accounts.google.com",
  "notes": "Personal Gmail account",
  "encryptedUsername": "encryptedValue",
  "encryptedPassword": "encryptedValue",
  "iv": "initializationVector",
  "tag": "tag_value",
  "folderId": "uuid or null",
  "encryptedDataKey": "encryptedWithPublicKeyValue"
}
```

**Response (201 - Created):**

```json
{
  "success": true,
  "message": "Credential created and secured",
  "data": {
    "credential": {
      "id": "uuid",
      "userId": "currentUserId",
      "title": "Gmail Account",
      "logInUrl": "https://accounts.google.com",
      "notes": "Personal Gmail account",
      "encryptedUsername": "encryptedValue",
      "encryptedPassword": "encryptedValue",
      "iv": "initializationVector",
      "tag": "tag_value",
      "favorite": false,
      "folderId": null,
      "createdAt": "2025-01-04T10:00:00Z",
      "updatedAt": "2025-01-04T10:00:00Z"
    },
    "permission": {
      "id": "uuid",
      "userId": "currentUserId",
      "credentialId": "uuid",
      "encryptedDataKey": "encryptedWithPublicKeyValue",
      "iv": "initializationVector",
      "createdAt": "2025-01-04T10:00:00Z",
      "updatedAt": "2025-01-04T10:00:00Z"
    }
  }
}
```

**Error Responses:**

| Status | Error        | Description                                    |
| ------ | ------------ | ---------------------------------------------- |
| 401    | Unauthorized | Invalid or missing JWT token                   |
| 500    | Server Error | Database transaction error or unexpected error |

**Validation:**

- `title`: Required, string
- `logInUrl`: Optional, string (URL format)
- `notes`: Optional, string
- `encryptedUsername`: Required, string (encrypted by frontend)
- `encryptedPassword`: Required, string (encrypted by frontend)
- `iv`: Required, string (initialization vector for encryption)
- `tag`: Required, string (authentication tag for encrypted data)
- `encryptedDataKey`: Required, string (encrypted with user's public key)
- `folderId`: Optional, UUID (must be valid folder owned by user)

**Notes:**

- Uses database transaction to ensure both credential and permission are created atomically
- Encrypted data is encrypted by frontend before transmission
- Data Key is encrypted using user's public key (frontend responsibility)
- User automatically becomes the owner with full permissions

---

### PUT /credential/:id

**Description:** Update an existing credential (owner only).

**Headers:**

```
Authorization: Bearer {token}
Content-Type: application/json
```

**URL Parameters:**

- `id` (required): UUID of the credential to update

**Request Body:**

```json
{
  "title": "Updated Gmail Account",
  "logInUrl": "https://accounts.google.com",
  "notes": "Updated notes",
  "encryptedUsername": "newEncryptedValue",
  "encryptedPassword": "newEncryptedValue",
  "iv": "newInitializationVector",
  "tag": "new_tag_value",
  "favorite": true,
  "folderId": "uuid or null"
}
```

**Response (200 - OK):**

```json
{
  "success": true,
  "message": "Credential updated successfully",
  "data": {
    "id": "uuid",
    "userId": "ownerUserId",
    "title": "Updated Gmail Account",
    "logInUrl": "https://accounts.google.com",
    "notes": "Updated notes",
    "encryptedUsername": "newEncryptedValue",
    "encryptedPassword": "newEncryptedValue",
    "iv": "newInitializationVector",
    "tag": "new_tag_value",
    "favorite": true,
    "folderId": null,
    "createdAt": "2025-01-04T10:00:00Z",
    "updatedAt": "2025-01-04T10:00:00Z"
  }
}
```

**Error Responses:**

| Status | Error                                                   | Description                  |
| ------ | ------------------------------------------------------- | ---------------------------- |
| 404    | Credential not found                                    | Credential doesn't exist     |
| 403    | Unauthorized: Only the owner can update this credential | User is not the owner        |
| 401    | Unauthorized                                            | Invalid or missing JWT token |
| 500    | Server Error                                            | Unexpected server error      |

**Validation:**

- User must be the credential owner (not just have read access)
- All fields are optional but recommended to provide complete data

**Notes:**

- Only credential owner can update
- Users with shared access cannot update the credential itself
- Encryption/decryption handled entirely by frontend
- IV and tag should be generated fresh by frontend for each update

---

### DELETE /credential/:id

**Description:** Delete a credential and all associated permissions (owner only).

**Headers:**

```
Authorization: Bearer {token}
Content-Type: application/json
```

**URL Parameters:**

- `id` (required): UUID of the credential to delete

**Response (200 - OK):**

```json
{
  "success": true,
  "message": "Credential deleted successfully"
}
```

**Error Responses:**

| Status | Error                                | Description                                   |
| ------ | ------------------------------------ | --------------------------------------------- |
| 404    | Credential not found or unauthorized | Credential doesn't exist or user is not owner |
| 401    | Unauthorized                         | Invalid or missing JWT token                  |
| 500    | Server Error                         | Unexpected server error                       |

**Notes:**

- Only credential owner can delete
- Deletes all permission records (all shared access is revoked)
- Cascade delete ensures data integrity
- Action is permanent

---

## Share Routes

**Base Path:** `/share`

**Authentication:** ✅ Required for all endpoints (Bearer token)

---

### POST /share/share-request

**Description:** Request to share a credential with another user. Returns the target user's public key for key wrapping.

**Headers:**

```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**

```json
{
  "credentialId": "uuid",
  "targetEmail": "recipient@example.com"
}
```

**Response (200 - OK):**

```json
{
  "success": true,
  "message": "Target user found. Please encrypt the Data Key with this Public Key.",
  "data": {
    "targetUserId": "uuid",
    "targetPublicKey": "publicKeyValue",
    "encryptedDataKey": "originalEncryptedDataKeyValue"
  }
}
```

**Error Responses:**

| Status | Error                                               | Description                                   |
| ------ | --------------------------------------------------- | --------------------------------------------- |
| 404    | User with that email not found                      | No user exists with provided email            |
| 403    | You do not have permission to share this credential | User doesn't own or have access to credential |
| 401    | Unauthorized                                        | Invalid or missing JWT token                  |
| 500    | Server Error                                        | Unexpected server error                       |

**Validation:**

- `credentialId`: Required, UUID (must exist and user must have access)
- `targetEmail`: Required, valid email format (must exist in system)

**Notes:**

- Does NOT create permission yet (sharing is two-step process)
- Returns target user's public key for frontend to encrypt data key
- If already shared, returns success with message
- Frontend must re-encrypt the Data Key with target's public key before confirming
- Security: Backend cannot re-encrypt because it doesn't have private keys

---

### POST /share/confirm-share

**Description:** Confirm credential share by creating permission record with re-encrypted data key.

**Headers:**

```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**

```json
{
  "credentialId": "uuid",
  "targetUserId": "uuid",
  "newlyEncryptedDataKey": "dataKeyEncryptedWithTargetPublicKey",
  "iv": "initializationVector"
}
```

**Response (201 - Created):**

```json
{
  "success": true,
  "message": "Access granted successfully",
  "data": {
    "id": "uuid",
    "userId": "targetUserId",
    "credentialId": "uuid",
    "encryptedDataKey": "dataKeyEncryptedWithTargetPublicKey",
    "iv": "initializationVector",
    "createdAt": "2025-01-04T10:00:00Z",
    "updatedAt": "2025-01-04T10:00:00Z"
  }
}
```

**Error Responses:**

| Status | Error                     | Description                              |
| ------ | ------------------------- | ---------------------------------------- |
| 409    | P2002 (Unique Constraint) | Credential already shared with this user |
| 401    | Unauthorized              | Invalid or missing JWT token             |
| 500    | Server Error              | Unexpected server error                  |

**Validation:**

- `credentialId`: Required, UUID (must exist)
- `targetUserId`: Required, UUID (must exist)
- `newlyEncryptedDataKey`: Required, string (encrypted by frontend with target's public key)
- `iv`: Optional, string (IV used during public key encryption)

**Notes:**

- Must follow share-request endpoint to get target's public key
- Frontend must re-encrypt data key with target user's public key
- Creates permission record linking target user to credential
- Target can now decrypt and access the credential using their private key

---

### DELETE /share/share/:credentialId/:targetUserId

**Description:** Revoke shared access to a credential (owner only).

**Headers:**

```
Authorization: Bearer {token}
Content-Type: application/json
```

**URL Parameters:**

- `credentialId` (required): UUID of the credential
- `targetUserId` (required): UUID of the user whose access is being revoked

**Response (200 - OK):**

```json
{
  "success": true,
  "message": "Access revoked successfully"
}
```

**Error Responses:**

| Status | Error                                                             | Description                      |
| ------ | ----------------------------------------------------------------- | -------------------------------- |
| 403    | Unauthorized: Only the owner can revoke access                    | User is not the credential owner |
| 400    | You cannot revoke your own access. Delete the credential instead. | Attempting to revoke own access  |
| 401    | Unauthorized                                                      | Invalid or missing JWT token     |
| 500    | Server Error                                                      | Unexpected server error          |

**Validation:**

- `credentialId`: Required, UUID (credential must exist)
- `targetUserId`: Required, UUID (must be different from requesting user)

**Notes:**

- Only credential owner can revoke access
- Owner cannot revoke their own access (must delete credential instead)
- Immediately removes user's ability to access credential
- Deletes the specific permission record

---

### PATCH /share/:id/favorite

**Description:** Toggle favorite status of a credential (owner only).

**Headers:**

```
Authorization: Bearer {token}
Content-Type: application/json
```

**URL Parameters:**

- `id` (required): UUID of the credential

**Request Body:**

```json
{}
```

**Response (200 - OK):**

```json
{
  "success": true,
  "message": "Added to favorites",
  "data": {
    "favorite": true
  }
}
```

**Alternative Success Response (when removing from favorites):**

```json
{
  "success": true,
  "message": "Removed from favorites",
  "data": {
    "favorite": false
  }
}
```

**Error Responses:**

| Status | Error                                | Description                                   |
| ------ | ------------------------------------ | --------------------------------------------- |
| 404    | Credential not found or unauthorized | Credential doesn't exist or user is not owner |
| 401    | Unauthorized                         | Invalid or missing JWT token                  |
| 500    | Server Error                         | Unexpected server error                       |

**Notes:**

- Toggles favorite boolean (true → false, false → true)
- Only credential owner can manage favorite status
- Currently managed at credential level (not per-user)
- Users with shared access cannot toggle favorites

---

## Error Responses

### Common Error Status Codes

| Status | Error        | Description                                   |
| ------ | ------------ | --------------------------------------------- |
| 400    | Bad Request  | Invalid request format or validation failed   |
| 401    | Unauthorized | Missing or invalid JWT token, session expired |
| 403    | Forbidden    | User lacks permission to perform action       |
| 404    | Not Found    | Resource doesn't exist                        |
| 409    | Conflict     | Duplicate entry (e.g., email already exists)  |
| 500    | Server Error | Unexpected server error                       |

### Error Response Format

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

### JWT Token Error Handling

| Error         | Status | Message                                        |
| ------------- | ------ | ---------------------------------------------- |
| Missing Token | 401    | Unauthorized                                   |
| Invalid Token | 401    | Unauthorized                                   |
| Expired Token | 401    | Your session has expired. Please log in again. |

---

## Authentication Notes

### JWT Token Format

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InV1aWQiLCJpYXQiOjE2NzgyOTM5OTYsImV4cCI6MTY3ODI5NzU5Nn0.signature
```

- Token is obtained from `/auth/sign-up` or `/auth/sign-in`
- Token includes user ID in payload
- Token expires based on `JWT_EXPIRES_IN` environment variable
- Always include token in `Authorization` header for protected routes

### Encryption & Keys

- **Encryption Type:** End-to-End Encryption (E2EE)
- **Key Management:**
  - Each user has a public/private key pair
  - Credentials are encrypted with a Data Key
  - Data Key is encrypted with user's public key
  - Decryption happens only on client-side with private key
- **Frontend Responsibility:**
  - Encrypt/decrypt credential data
  - Generate IVs and authentication tags
  - Re-encrypt data keys for sharing
- **Backend Responsibility:**
  - Store encrypted data
  - Manage permissions
  - Never access plaintext data

---

## Security Considerations

1. **Always use HTTPS** in production
2. **Token Storage:** Store JWT in secure, httpOnly cookies or secure storage
3. **Password Strength:** Enforce minimum password requirements on client
4. **Data Encryption:** All sensitive data encrypted before transmission
5. **CORS:** Configured to accept requests only from frontend origin
6. **Helmet:** Security headers applied to all responses
7. **Permission Checks:** Backend enforces access control before returning data
8. **Cascade Delete:** Deleting credential revokes all shared access automatically

---

## Environment Variables Required

```
PORT=5000
CLIENT_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
DATABASE_URL=your_database_connection_string
```

---

**Last Updated:** January 4, 2026
