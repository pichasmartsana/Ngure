# Ngureh Ryan website + admin editor

Two pages in one folder:

| File | What it is |
|---|---|
| `index.html` | The public website. It has **no link or button to the admin**. |
| `admin.html` | The private editor. Visitors only reach it if they know the address, and it needs the admin's email and password. |
| `config.js` | Your Supabase address and key (step 3). |
| `setup.sql` | One-time database setup (step 1). |
| `content.js`, `store.js`, `site.js`, `site.css` | The site's content and code. You do not need to touch these. |

## What the admin can edit
Everything on the page: all text and headings, the email that receives messages, the camera-frame photos and videos on the home page, the portrait, portfolio projects and photos, services, courses, memberships, store items, and full stories. Sections can be hidden, items can be added, reordered, duplicated and deleted. **Preview draft** shows changes privately; **Publish** makes them live for everyone.

## Set-up (about 10 minutes, once)

1. **Create the database.** Make a free project at supabase.com. Open *SQL Editor → New query*, paste `setup.sql`, change the admin email on the line marked `CHANGE`, and click *Run*.
2. **Create the admin login.** In Supabase open *Authentication → Users → Add user*. Enter the same email and a strong password, and tick *Auto Confirm User*. Then open *Authentication → Sign In / Providers* and turn **off** "Allow new users to sign up".
3. **Connect the site.** In *Project Settings → API* copy the **Project URL** and the **anon public** key into `config.js`.
4. **Put the folder online.** Upload the whole folder to any static host (Netlify "drag and drop", Cloudflare Pages, GitHub Pages). The website is the main address; the editor is at `…/admin.html`. Do not link to `admin.html` from anywhere.

Until step 3 is done the pages run in **demo mode**: you can try the editor, but edits stay in that one browser and nobody else sees them.

## Notes
- **Videos:** use MP4 (H.264). The free Supabase plan allows up to 50 MB per file, so compress long videos first. Videos in the frame play without sound, as browsers require.
- **Photos:** large photos are shrunk automatically before upload so the site stays fast.
- **Slideshow:** with two or more items in the camera frame, they play in order; photos stay for the number of seconds set in the editor, and videos play until they end (up to 30 seconds).
- **Security:** only emails listed in the `site_admins` table can change anything, and that is enforced by the database itself, not just by hiding the page. To add another admin, add the email to that table and create their user.
- **Forgot the password?** Reset it in Supabase under *Authentication → Users*.
- **Backups:** *Download backup* in the editor saves everything as one file; *Restore from backup* loads it back.
