const appName = "StatProbLab";
let score = 0;

function greet(name) {
    return "Hello, " + name;
}

const greet2 = (name) => "Hello, " + name;

const colors = ["#5DADE2", "#58D68D", "#AF7AC5"]
colors.push("#F5B041");
colors[0];
colors.map(c => c + "88");

const stats = {
    mean: 45.2,
    sd: 12.1,
    n: 30
};
stats["mean"];

const btn = document.getElementById("myBtn");
btn.textContent = "New Label";
btn.style.background = "red";

btn.addEventListener("click", () {
    alert("Button clicked!");
})

function showPage(id) {
    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    document.getElementById('page-' + id).classList.add("active");
}