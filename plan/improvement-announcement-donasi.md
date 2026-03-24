The current dashboard is a bit "linear." To support new features like Hadits, Donations, and Announcements, we should move to a **Sidebar-based Dashboard** or a **Tabbed Interface**.

---

## 🛠 Admin Dashboard Improvement Plan

### 1. The Layout Strategy: "Sidebar Navigation"
Instead of one long scrolling page, categorize the features:
* **Dashboard:** Overview of active settings and quick "Live View" button.
* **Schedule:** Prayer times and Iqomah durations.
* **Content Gallery:** Managing Hadiths and Quotes (List view: Add/Edit/Delete).
* **Bulletin Board:** Managing Announcements and "Running Text."
* **Financials:** Managing Donation updates and reports.
* **System:** Mosque name, background images, and display settings.

### 2. New Feature Breakdown

| Feature | Input Fields Needed | UI Element |
| :--- | :--- | :--- |
| **Hadits/Quotes** | Text Area (Hadits content), Source (Narrator/Book). | List with "Toggle Active" switch. |
| **Donasi** | Category (Infaq, Anak Yatim), Total Amount, Target (Optional). | Simple table with currency formatting. |
| **Pengumuman** | Title, Content, Priority (Normal/Urgent), Expiry Date. | Cards with "Draft/Publish" status. |
| **Info Masjid** | Address, Social Media, QR Code for Zakat. | Profile settings page. |

---

## 🎨 Implementation Plan for AI Agents

Here is the technical brief you can give to your AI Agent to build the updated Dashboard:

### Phase 1: Sidebar & Navigation (UI Shell)
* **Design:** Use a clean Sidebar (Left) and Content Area (Right).
* **Color:** Use **Deep Emerald Green (#1B4332)** for the sidebar and **White/Light Gray (#F8F9FA)** for the content cards.
* **Icons:** Use *Lucide Icons* or *FontAwesome* for "Clock", "Message", "Heart", and "Image".

### Phase 2: Content Management (The "Add" logic)
* **Hadits Manager:** Create a list view where users can add multiple Hadiths. The AI should implement a "Rotation" setting (e.g., "Change every 60 seconds").
* **Donation Tracker:** Create a simple form for "Last Friday's Collection" and "Total Renovation Fund."
* **Dynamic Running Text:** Instead of one box, allow multiple messages that can be prioritized.

### Phase 3: Better Form UX
* **Visual Feedback:** Change "Save" buttons to show "Saving..." or "Saved!" states.
* **Live Preview:** Add a "Preview Display" button that opens a small popup window showing exactly what the TV looks like.

---

## 💻 Code Snippet (Tailwind CSS Admin Shell)
You can ask your AI Agent to start with this modern structure:

```html
<div class="flex h-screen bg-gray-100 font-inter">
    <aside class="w-64 bg-[#1B4332] text-white flex flex-col">
        <div class="p-6 font-poppins font-bold text-xl border-b border-emerald-800">
            Admin Al-Muhajirin
        </div>
        <nav class="flex-grow p-4 space-y-2">
            <a href="#" class="block p-3 bg-emerald-700 rounded-lg">🕒 Prayer Times</a>
            <a href="#" class="block p-3 hover:bg-emerald-800 rounded-lg">📜 Hadits List</a>
            <a href="#" class="block p-3 hover:bg-emerald-800 rounded-lg">📢 Announcements</a>
            <a href="#" class="block p-3 hover:bg-emerald-800 rounded-lg">💰 Donations</a>
            <a href="#" class="block p-3 hover:bg-emerald-800 rounded-lg">🖼 Backgrounds</a>
        </nav>
    </aside>

    <main class="flex-grow flex flex-col overflow-y-auto">
        <header class="bg-white p-6 shadow-sm flex justify-between">
            <h2 class="text-xl font-bold">Prayer Schedule Settings</h2>
            <button class="bg-blue-600 text-white px-4 py-2 rounded-lg">Preview Live Display</button>
        </header>

        <section class="p-8 space-y-6">
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 class="font-bold text-lg mb-4">Manage Donations</h3>
                <div class="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="Category (e.g. Infaq Jumat)" class="border p-2 rounded w-full">
                    <input type="number" placeholder="Amount (Rp)" class="border p-2 rounded w-full">
                </div>
                <button class="mt-4 bg-[#1B4332] text-white px-6 py-2 rounded">Update Donation Board</button>
            </div>
            
            </section>
    </main>
</div>
```

**Would you like me to focus on creating the detailed "Hadits Management" screen specifically, or would you like the full logic for the "Donation" input first?**