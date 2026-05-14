import customtkinter as ctk
import math

app = ctk.CTk()
app.geometry("800x500")

app.title("StatProbLab")

app.iconbitmap("icon.ico")

'''Easing'''
def easeInSine(t):
    return 1 - math.cos((t * math.pi) / 2)

animationStyle = easeInSine

'''Sidebar'''
sidebar = ctk.CTkFrame(app, width=60, corner_radius=0)
sidebar.pack(side="left", fill="y")
sidebar.pack_propagate(False)

main = ctk.CTkFrame(app)
main.pack(side="right", fill="both", expand=True)

label = ctk.CTkLabel(main, text="Main Content Area")
label.pack(pady=20)

'''States'''
collapsedWidth = 60
expandedWidth = 200

t = 0
target = 0
speed = 0.05

currentWidth = collapsedWidth

'''Loops'''
def update():
    global t, currentWidth

    # move t toward target
    if t < target:
        t += speed
        if t > target:
            t = target

    elif t > target:
        t -= speed
        if t < target:
            t = target

    # easing
    eased = animationStyle(t)

    # interpolate width
    currentWidth = collapsedWidth + eased * (expandedWidth - collapsedWidth)

    sidebar.configure(width=int(currentWidth))

    app.after(5, update)

'''Events'''
def expand(event=None):
    global target
    target = 1

def collapse(event=None):
    global target
    target = 0

'''Bindings'''
sidebar.bind("<Enter>", expand)
sidebar.bind("<Leave>", collapse)

'''Updates'''
update()

'''Mainloop'''
app.mainloop()
