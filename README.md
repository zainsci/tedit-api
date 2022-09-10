# TEDIT - Social Media CRUD API

A simple social media CRUD API. Kinda like how Twitter where Users Post in Groups.

#### Stack Used

1. Express with TypeScript
2. Prisma ORM
3. PostgresQL

#### Tables/Models

1. Users
2. Groups
3. Posts

#### What Can It Do?

1. Register and Login Users
2. Create and Updating Groups
3. Creating, Reading, Updating and Deleting Posts

#### Setting up locally

```bash
$ git clone https://www.github.com/zainsci/tedit-api.git
$ cd tedit-api
# Install Dependencies
$ yarn
```

Setup the following environment variables in the `.env` file.

```bash
# .env
DATABASE_URL="postgresql://<username>:<password>@localhost:5432/<database_name>?schema=public"
JWT_SECRET="<some random characters>"
```

```bash
# Run the server
$ yarn dev
```

#### TODO

- [x] Add Change Password feature
- [x] Add Comments to Posts
- [ ] Allow Images in Posts
- [ ] Adding Upvotes and Downvotes to Posts
- [ ] Add Comment to other Comments
