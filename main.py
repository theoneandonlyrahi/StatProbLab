import customtkinter as ctk

# ---------------- APP ----------------

ctk.set_appearance_mode("dark")

app = ctk.CTk()
app.title("StatProbLab")
app.geometry("1100x650")
app.state("zoomed")
app.configure(fg_color="#1E1E1E")

# ---------------- FONTS ----------------

titleFont = ctk.CTkFont("Montserrat", 30, "bold")
sidebarFont = ctk.CTkFont("Montserrat", 17, "bold")
cardTitleFont = ctk.CTkFont("Montserrat", 16, "bold")
cardTextFont = ctk.CTkFont("Montserrat", 12)

# ---------------- ROOT ----------------

root = ctk.CTkFrame(app, fg_color="transparent")
root.pack(fill="both", expand=True)

# ---------------- SIDEBAR ----------------

sidebar = ctk.CTkFrame(root, width=260, fg_color="#181818", corner_radius=0)
sidebar.pack(side="left", fill="y")
sidebar.pack_propagate(False)

# ---------------- MAIN ----------------

mainContent = ctk.CTkFrame(root, fg_color="#1E1E1E")
mainContent.pack(side="right", fill="both", expand=True)

# ---------------- PAGES ----------------

pages = {}

def createPage(name):
    frame = ctk.CTkFrame(mainContent, fg_color="#1E1E1E")
    frame.place(relwidth=1, relheight=1)
    pages[name] = frame
    return frame

def showPage(name):
    pages[name].tkraise()

home = createPage("Home")
categorical = createPage("Categorical")
quantitative = createPage("Quantitative")
distributions = createPage("Distributions")
simulations = createPage("Simulations")
settings = createPage("Settings")

# ---------------- CARD SYSTEM ----------------

def createCard(parent, title, text="", color="#3A3A3A"):

    card = ctk.CTkFrame(parent, fg_color="#242424", corner_radius=15)
    card.pack_propagate(False)

    img = ctk.CTkFrame(card, fg_color=color, corner_radius=10)
    img.pack(pady=(15, 8), padx=15, fill="both", expand=True)

    ctk.CTkLabel(
        img,
        text="Preview",
        font=ctk.CTkFont("Montserrat", 13, "bold")
    ).pack(expand=True)

    ctk.CTkLabel(card, text=title, font=cardTitleFont).pack()
    ctk.CTkLabel(card, text=text, font=cardTextFont).pack(pady=(2, 10))

    return card

# ---------------- HOME ----------------

ctk.CTkLabel(home, text="StatProbLab", font=titleFont).pack(pady=40)
ctk.CTkLabel(home, text="Select a category from the sidebar", font=cardTextFont).pack()

# ---------------- CATEGORICAL ----------------

catWrap = ctk.CTkFrame(categorical, fg_color="transparent")
catWrap.pack(expand=True)

catRow = ctk.CTkFrame(catWrap, fg_color="transparent")
catRow.pack()

catCards = [
    createCard(catRow, "One Variable (Single Group)", color="#5DADE2"),
    createCard(catRow, "One Variable (Multiple Groups)", color="#3498DB"),
    createCard(catRow, "Two Categorical Variables", color="#2E86C1"),
]

for c in catCards:
    c.pack(side="left", padx=20)

# ---------------- QUANTITATIVE ----------------

quantWrap = ctk.CTkFrame(quantitative, fg_color="transparent")
quantWrap.pack(expand=True)

quantRow = ctk.CTkFrame(quantWrap, fg_color="transparent")
quantRow.pack()

quantCards = [
    createCard(quantRow, "One Variable (Single Group)", color="#58D68D"),
    createCard(quantRow, "One Variable (Multiple Groups)", color="#2ECC71"),
    createCard(quantRow, "Two Variables", color="#27AE60"),
    createCard(quantRow, "Multiple Regression", color="#1E8449"),
]

for c in quantCards:
    c.pack(side="left", padx=20)

# ---------------- DISTRIBUTIONS ----------------

distWrap = ctk.CTkFrame(distributions, fg_color="transparent")
distWrap.pack(expand=True)

distRow = ctk.CTkFrame(distWrap, fg_color="transparent")
distRow.pack()

distCards = [
    createCard(distRow, "Normal", color="#AF7AC5"),
    createCard(distRow, "Binomial", color="#BB8FCE"),
    createCard(distRow, "Poisson", color="#D2B4DE"),
]

for c in distCards:
    c.pack(side="left", padx=20)

# ---------------- SIMULATIONS ----------------

simWrap = ctk.CTkFrame(simulations, fg_color="transparent")
simWrap.pack(expand=True)

simRow = ctk.CTkFrame(simWrap, fg_color="transparent")
simRow.pack()

simCards = [
    createCard(simRow, "Monte Carlo Simulation", color="#F5B041"),
    createCard(simRow, "Dice Roll Simulation", color="#E67E22"),
]

for c in simCards:
    c.pack(side="left", padx=20)

# ---------------- SAFE RESIZE SYSTEM (FIXED) ----------------

lastSize = {"w": 0, "h": 0}

def resizeCards():

    w = app.winfo_width()
    h = app.winfo_height()

    # ignore tiny jitter (THIS fixes glitching)
    if abs(w - lastSize["w"]) < 10 and abs(h - lastSize["h"]) < 10:
        return

    lastSize["w"] = w
    lastSize["h"] = h

    cardW = max(180, min(320, w // 6))
    cardH = max(140, min(220, h // 4))

    allCards = catCards + quantCards + distCards + simCards

    for card in allCards:
        card.configure(width=cardW, height=cardH)

def delayedResize(event):
    app.after(50, resizeCards)

app.bind("<Configure>", delayedResize)

# ---------------- SETTINGS ----------------

ctk.CTkLabel(settings, text="Settings", font=titleFont).pack(pady=40)

# ---------------- SIDEBAR ----------------

ctk.CTkLabel(sidebar, text="StatProbLab", font=titleFont).pack(pady=(30, 40))

nav = [
    ("Home", "Home"),
    ("Categorical", "Categorical"),
    ("Quantitative", "Quantitative"),
    ("Distributions", "Distributions"),
    ("Simulations", "Simulations"),
    ("Settings", "Settings")
]

for text, page in nav:
    ctk.CTkButton(
        sidebar,
        text=text,
        font=sidebarFont,
        height=42,
        command=lambda p=page: showPage(p)
    ).pack(fill="x", padx=15, pady=8)

# ---------------- START ----------------

showPage("Home")

app.mainloop()
