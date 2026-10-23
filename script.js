const startButton = document.querySelector("button");
const welcomePage = document.querySelector(".welcome-page");
const dashboard = document.querySelector(".dashboard");

let editingPlantId = null;

startButton.addEventListener("click", function () {
    welcomePage.style.display = "none";
    dashboard.style.display = "block";
});

const addPlantButton = document.getElementById("addPlantButton");
const addPlantForm = document.getElementById("addPlantForm");
const closeAddPlantButton = document.getElementById("closeAddPlantButton");

addPlantForm.style.display = "none";

addPlantButton.addEventListener("click", function () {
    addPlantForm.style.display = "block";
});

closeAddPlantButton.addEventListener("click", function () {
    addPlantForm.style.display = "none";
    resetPlantForm();
    editingPlantId = null;
});

const usesFertilizer = document.getElementById("usesFertilizer");
const fertilizerScheduleContainer = document.getElementById("fertilizerScheduleContainer");

fertilizerScheduleContainer.style.display = "none";

usesFertilizer.addEventListener("change", function () {

    if (usesFertilizer.value === "yes") {
        fertilizerScheduleContainer.style.display = "block";
    } else {
        fertilizerScheduleContainer.style.display = "none";
    }

});

const savePlantButton = document.getElementById("savePlantButton");

function resetPlantForm() {
    document.getElementById("plantName").value = "";
    document.getElementById("plantType").value = "";
    document.getElementById("plantPhoto").value = "";
    document.getElementById("wateringSchedule").value = "";
    document.getElementById("usesFertilizer").value = "no";
    document.getElementById("fertilizerSchedule").value = "";

    fertilizerScheduleContainer.style.display = "none";
}

savePlantButton.addEventListener("click", function () {

    const plantName = document.getElementById("plantName").value;
    const plantType = document.getElementById("plantType").value;
    const plantPhoto = document.getElementById("plantPhoto").files[0];
    const wateringSchedule = document.getElementById("wateringSchedule").value;
    const usesFertilizerValue = document.getElementById("usesFertilizer").value;
    const fertilizerSchedule = document.getElementById("fertilizerSchedule").value;

    if (plantName === "" || plantType === "" || wateringSchedule === "") {
        alert("Mohon lengkapi data tanaman terlebih dahulu.");
        return;
    }

    if (usesFertilizerValue === "yes" && fertilizerSchedule === "") {
        alert("Mohon isi jadwal pemupukan.");
        return;
    }

    const plants = JSON.parse(localStorage.getItem("plants")) || [];

    let oldPlant = null;

    if (editingPlantId !== null) {
        oldPlant = plants.find(function (item) {
            return item.id === editingPlantId;
        });
    }

    const plant = {
        id: editingPlantId !== null ? editingPlantId : Date.now(),
        name: plantName,
        type: plantType,
        photo: oldPlant ? oldPlant.photo : null,
        wateringSchedule: Number(wateringSchedule),
        usesFertilizer: usesFertilizerValue === "yes",
        fertilizerSchedule: usesFertilizerValue === "yes"
            ? Number(fertilizerSchedule)
            : null,
        lastWatered: oldPlant ? oldPlant.lastWatered : null,
        lastFertilized: oldPlant ? oldPlant.lastFertilized : null
    };

    function finishSaving() {

        if (editingPlantId !== null) {

            const index = plants.findIndex(function (item) {
                return item.id === editingPlantId;
            });

            if (index !== -1) {
                plants[index] = plant;
            }

        } else {
            plants.push(plant);
        }

       localStorage.setItem("plants", JSON.stringify(plants));

       const wasEditing = editingPlantId !== null;

       alert(
       wasEditing
        ? "Data tanaman berhasil diperbarui!"
        : "Tanaman berhasil disimpan!"
       );
       
       addPlantForm.style.display = "none";
       resetPlantForm();

       editingPlantId = null;

       document.getElementById("plantFormTitle").textContent = "Tambah Tanaman 🌱";

       displayPlants(JSON.parse(localStorage.getItem("plants")) || []);
    }

    if (plantPhoto) {

        const reader = new FileReader();

        reader.onload = function () {
            plant.photo = reader.result;
            finishSaving();
        };

        reader.readAsDataURL(plantPhoto);

    } else {
        finishSaving();
    }

});


function parsePlantDate(dateString) {
    if (!dateString) {
        return null;
    }

    const months = {
        "januari": 0,
        "februari": 1,
        "maret": 2,
        "april": 3,
        "mei": 4,
        "juni": 5,
        "juli": 6,
        "agustus": 7,
        "september": 8,
        "oktober": 9,
        "november": 10,
        "desember": 11
    };

    const parts = dateString.trim().split(/\s+/);

    if (parts.length !== 3) {
        return null;
    }

    const day = Number(parts[0]);
    const month = months[parts[1].toLowerCase()];
    const year = Number(parts[2]);

    if (
        !Number.isInteger(day) ||
        month === undefined ||
        !Number.isInteger(year)
    ) {
        return null;
    }

    const date = new Date(year, month, day);

    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month ||
        date.getDate() !== day
    ) {
        return null;
    }

    return date;
}

function updateDashboardStats(plants) {
    const totalPlants = document.getElementById("totalPlants");
    const plantsToWater = document.getElementById("plantsToWater");
    const plantsToFertilize = document.getElementById("plantsToFertilize");

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    function daysSince(dateString) {
        const lastDate = parsePlantDate(dateString);

        if (!lastDate) {
            return null;
        }

        const todayNumber = Date.UTC(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
        );

        const lastDateNumber = Date.UTC(
            lastDate.getFullYear(),
            lastDate.getMonth(),
            lastDate.getDate()
        );

        return Math.floor(
            (todayNumber - lastDateNumber) / 86400000
        );
    }

    let waterCount = 0;
    let fertilizerCount = 0;

    plants.forEach(function (plant) {
        const wateringDays = Number(plant.wateringSchedule);
        const waterElapsed = daysSince(plant.lastWatered);

        if (
            !plant.lastWatered ||
            waterElapsed === null ||
            waterElapsed >= wateringDays
        ) {
            waterCount++;
        }

        if (plant.usesFertilizer) {
            const fertilizerDays = Number(plant.fertilizerSchedule);
            const fertilizerElapsed = daysSince(plant.lastFertilized);

            if (
                !plant.lastFertilized ||
                fertilizerElapsed === null ||
                fertilizerElapsed >= fertilizerDays
            ) {
                fertilizerCount++;
            }
        }
    });

    totalPlants.textContent = plants.length;
    plantsToWater.textContent = waterCount;
    plantsToFertilize.textContent = fertilizerCount;
}

function displayPlants(plants) {
    updateDashboardStats(plants);
    const plantCards = document.getElementById("plantCards");
    const emptyPlantMessage = document.getElementById("emptyPlantMessage");
    const addPlantButton = document.getElementById("addPlantButton");
    const detailContainer = document.getElementById("plantDetailContainer");

    plantCards.innerHTML = "";

    if (plants.length === 0) {
        emptyPlantMessage.style.display = "block";
        addPlantButton.classList.remove("add-button-top");
        return;
    }

    emptyPlantMessage.style.display = "none";
    addPlantButton.classList.add("add-button-top");

    plants.forEach(function (plant) {

        const plantCard = document.createElement("div");
        plantCard.className = "plant-card";

        const plantImage = plant.photo
            ? `<img src="${plant.photo}" class="plant-card-photo">`
            : `<div class="plant-card-icon">🌱</div>`;

        plantCard.innerHTML = `
            ${plantImage}
            <h3>${plant.name}</h3>
            <p>Terakhir disiram: ${
                plant.lastWatered ? plant.lastWatered : "Belum disiram"
            }</p>
         <div class="plant-card-buttons">
            <button class="edit-plant-button">✏️ Edit</button>
            <button class="water-plant-button">💧 Siram Sekarang</button>
            <button class="detail-plant-button">Detail Tanaman</button>
            <button class="delete-plant-button">🗑️</button>
         </div>
        `;

        const detailButton = plantCard.querySelector(".detail-plant-button");

        const editButton = plantCard.querySelector(".edit-plant-button");

        const waterButton = plantCard.querySelector(".water-plant-button");

        const deleteButton = plantCard.querySelector(".delete-plant-button");

        waterButton.addEventListener("click", function () {

        const plants = JSON.parse(localStorage.getItem("plants")) || [];

        const plantIndex = plants.findIndex(function (item) {
        return item.id === plant.id;
    });

    if (plantIndex !== -1) {

        const today = new Date();

        const date = today.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });

        plants[plantIndex].lastWatered = date;

        localStorage.setItem("plants", JSON.stringify(plants));

        displayPlants(plants);
    }

});
    
deleteButton.addEventListener("click", function () {

    const confirmDelete = confirm(
        "Apakah kamu yakin ingin menghapus tanaman ini?"
    );

    if (!confirmDelete) {
        return;
    }

    const plants = JSON.parse(localStorage.getItem("plants")) || [];

    const updatedPlants = plants.filter(function (item) {
        return item.id !== plant.id;
    });

    localStorage.setItem("plants", JSON.stringify(updatedPlants));

    displayPlants(updatedPlants);
});

editButton.addEventListener("click", function () {

    editingPlantId = plant.id;

    addPlantForm.style.display = "block";
    
    document.getElementById("plantFormTitle").textContent = "Edit Tanaman ✏️";

    document.getElementById("plantName").value = plant.name;
    document.getElementById("plantType").value = plant.type;
    document.getElementById("wateringSchedule").value = plant.wateringSchedule;

    if (plant.usesFertilizer) {

        document.getElementById("usesFertilizer").value = "yes";

        fertilizerScheduleContainer.style.display = "block";

        document.getElementById("fertilizerSchedule").value =
            plant.fertilizerSchedule;

    } else {

        document.getElementById("usesFertilizer").value = "no";

        fertilizerScheduleContainer.style.display = "none";

        document.getElementById("fertilizerSchedule").value = "";
    }

    document.getElementById("plantPhoto").value = "";
});

        detailButton.addEventListener("click", function () {

            detailContainer.innerHTML = `
                <div class="plant-detail-card">

                    ${
                        plant.photo
                        ? `<img src="${plant.photo}" class="plant-detail-photo">`
                        : `<div class="plant-detail-icon">🌱</div>`
                    }

                    <h2>${plant.name}</h2>

                    <p><strong>Jenis Tanaman:</strong> ${plant.type}</p>

                    <p><strong>Jadwal Penyiraman:</strong>
                        Setiap ${plant.wateringSchedule} hari
                    </p>

                    <p><strong>Pemupukan:</strong>
                        ${
                            plant.usesFertilizer
                            ? `Setiap ${plant.fertilizerSchedule} hari`
                            : "Tidak menggunakan pemupukan"
                        }
                    </p>

                    <p><strong>Terakhir Disiram:</strong>
                        ${plant.lastWatered ? plant.lastWatered : "Belum disiram"}
                    </p>

                    <p><strong>Terakhir Dipupuk:</strong>
                        ${plant.lastFertilized ? plant.lastFertilized : "Belum dipupuk"}
                    </p>

                    <button id="closeDetailButton" class="close-detail-button">
                        Tutup
                    </button>

                </div>
            `;

            const closeDetailButton = document.getElementById("closeDetailButton");

            closeDetailButton.addEventListener("click", function () {
                detailContainer.innerHTML = "";
            });

        });

        plantCards.appendChild(plantCard);
    });
}
displayPlants(JSON.parse(localStorage.getItem("plants")) || []);

const addJournalButton = document.getElementById("addJournalButton");
const journalForm = document.getElementById("journalForm");
const closeJournalFormButton = document.getElementById("closeJournalFormButton");

function loadJournalPlantOptions(selectedPlantName = "") {
    const plantSelect = document.getElementById("journalPlantName");
    const plants = JSON.parse(localStorage.getItem("plants")) || [];

    plantSelect.innerHTML = '<option value="">Pilih tanaman</option>';

    plants.forEach(function (plant) {
        const option = document.createElement("option");
        option.value = plant.name;
        option.textContent = plant.name;

        if (plant.name === selectedPlantName) {
            option.selected = true;
        }

        plantSelect.appendChild(option);
    });
}

addJournalButton.addEventListener("click", function () {
    loadJournalPlantOptions();
    journalForm.style.display = "block";
});

closeJournalFormButton.addEventListener("click", function () {
    journalForm.style.display = "none";
});

const plantMenuButton = document.getElementById("plantMenuButton");
const journalMenuButton = document.getElementById("journalMenuButton");


const healthMenuButton = document.getElementById("healthMenuButton");
const healthSection = document.getElementById("healthSection");


const plantSection = document.getElementById("plantSection");
const journalSection = document.getElementById("journalSection");

plantMenuButton.addEventListener("click", function () {
    plantSection.style.display = "block";
    journalSection.style.display = "none";
    healthSection.style.display = "none";
    guideSection.style.display = "none";
});

journalMenuButton.addEventListener("click", function () {
    plantSection.style.display = "none";
    journalSection.style.display = "block";
    healthSection.style.display = "none";
    guideSection.style.display = "none";
});

healthMenuButton.addEventListener("click", function () {
    plantSection.style.display = "none";
    journalSection.style.display = "none";
    healthSection.style.display = "block";
    guideSection.style.display = "none";
});

guideMenuButton.addEventListener("click", function () {
    plantSection.style.display = "none";
    journalSection.style.display = "none";
    healthSection.style.display = "none";
    guideSection.style.display = "block";
});

document.getElementById("guideMenuButton").addEventListener("click", function () {
    plantSection.style.display = "none";
    journalSection.style.display = "none";
    healthSection.style.display = "none";
    guideSection.style.display = "block";
});

const saveJournalButton = document.getElementById("saveJournalButton");

saveJournalButton.addEventListener("click", function () {

    const plantName = document.getElementById("journalPlantName").value;
    const journalDate = document.getElementById("journalDate").value;
    const journalPhoto = document.getElementById("journalPhoto").files[0];
    const journalNote = document.getElementById("journalNote").value;
    const journalProgress = document.getElementById("journalProgress").value;

    if (plantName === "" || journalDate === "" || journalNote === "" || journalProgress === "") {
        alert("Mohon lengkapi data jurnal terlebih dahulu.");
        return;
    }

    const journals = JSON.parse(localStorage.getItem("journals")) || [];

    const journal = {
        id: Date.now(),
        plantName: plantName,
        date: journalDate,
        photo: null,
        note: journalNote,
        progress: Number(journalProgress)
    };

    function finishSavingJournal() {

        journals.push(journal);

        localStorage.setItem("journals", JSON.stringify(journals));

        alert("Jurnal berhasil disimpan!");

        journalForm.style.display = "none";

        document.getElementById("journalPlantName").value = "";
        document.getElementById("journalDate").value = "";
        document.getElementById("journalPhoto").value = "";
        document.getElementById("journalNote").value = "";
        document.getElementById("journalProgress").value = "";

        displayJournals();
    }

    if (journalPhoto) {

        const reader = new FileReader();

        reader.onload = function () {
            journal.photo = reader.result;
            finishSavingJournal();
        };

        reader.readAsDataURL(journalPhoto);

    } else {
        finishSavingJournal();
    }

});


let selectedJournalId = null;
let selectedProgressIndex = null;
let editingJournalId = null;

function displayJournals() {
    const journalList = document.getElementById("journalList");
    const journals = JSON.parse(localStorage.getItem("journals")) || [];

    journalList.innerHTML = "";

    journals.forEach(function (journal) {
        if (!Array.isArray(journal.progressHistory)) {
            journal.progressHistory = [];
        }

        const journalCard = document.createElement("div");
        journalCard.className = "journal-card";

        journalCard.innerHTML = `

            <div class="journal-photo">
                ${
                    journal.photo
                    ? `<img src="${journal.photo}" alt="Foto tanaman">`
                    : `<div class="journal-no-photo">🌱</div>`
                }
            </div>

            <div class="journal-info">
                <h3>${journal.plantName}</h3>
                <p><strong>Tanggal:</strong> ${journal.date}</p>
                <p><strong>Catatan:</strong> ${journal.note}</p>

                <div class="original-journal-actions">
                    <button class="edit-original-journal">✏️</button>
                    <button class="delete-original-journal">🗑️</button>
                </div>

                ${
                    journal.progressHistory.length > 0
                    ? `
                        <div class="progress-history">
                            <h4>Riwayat Perkembangan 🌿</h4>
                            ${journal.progressHistory.map(function (progress, index) {
                                return `
                                    <div class="progress-item">
                                        <p><strong>Progres ${index + 2}</strong></p>
                                        <p><strong>Tanggal:</strong> ${progress.date}</p>
                                        ${
                                            progress.photo
                                            ? `<img src="${progress.photo}" alt="Foto progres">`
                                            : ""
                                        }
                                        <p><strong>Catatan:</strong> ${progress.note}</p>

                                        <button class="edit-progress-button"
                                            data-index="${index}">
                                            ✏️
                                        </button>

                                        <button class="delete-progress-button"
                                            data-index="${index}">
                                            🗑️
                                        </button>
                                
                                    </div>
                                `;
                            }).join("")}
                        </div>
                    `
                    : ""
                }

                <button class="continue-progress-button">
                    🌱 Lanjutkan Progres
                </button>
            </div>
        `;

        journalCard.querySelector(
            ".edit-original-journal"
        ).addEventListener("click", function () {
            editingJournalId = journal.id;

            loadJournalPlantOptions(journal.plantName);

            document.querySelector(
                "#journalForm h3"
            ).textContent = "Edit Jurnal 📖";

            document.getElementById(
                "saveJournalButton"
            ).textContent = "Simpan Perubahan";

            document.getElementById("journalDate").value =
                journal.date || "";

            document.getElementById("journalPhoto").value = "";

            document.getElementById("journalNote").value =
                journal.note || "";

            document.getElementById("journalProgress").value =
                journal.progress ? String(journal.progress) : "";

            journalForm.style.display = "block";
        });

        
        journalCard.querySelector(
            ".delete-original-journal"
        ).addEventListener("click", function () {
            const confirmDelete = confirm(
                "Yakin ingin menghapus jurnal ini?"
            );

            if (!confirmDelete) {
                return;
            }

            const latestJournals =
                JSON.parse(localStorage.getItem("journals")) || [];

            const updatedJournals = latestJournals.filter(
                function (item) {
                    return item.id !== journal.id;
                }
            );

            localStorage.setItem(
                "journals",
                JSON.stringify(updatedJournals)
            );

            alert("Jurnal berhasil dihapus!");

            displayJournals();
        });


        const continueButton = journalCard.querySelector(
            ".continue-progress-button"
        );

                continueButton.addEventListener("click", function () {
            selectedJournalId = journal.id;
            selectedProgressIndex = null;

            document.querySelector(
                "#continueProgressForm h3"
            ).textContent = "Perkembangan Tanaman 🌿";

            document.getElementById(
                "saveProgressButton"
            ).textContent = "Simpan Progres";

            document.getElementById("progressDate").value = "";
            document.getElementById("progressPhoto").value = "";
            document.getElementById("progressNote").value = "";

            document.getElementById(
                "continueProgressForm"
            ).style.display = "block";
        });

        journalCard.querySelectorAll(".edit-progress-button").forEach(
            function (button) {
                button.addEventListener("click", function () {
                    selectedJournalId = journal.id;
                    selectedProgressIndex = Number(button.dataset.index);

                    const progress =
                        journal.progressHistory[selectedProgressIndex];

                    document.querySelector(
                        "#continueProgressForm h3"
                    ).textContent = "Edit Perkembangan 🌿";

                    document.getElementById(
                        "saveProgressButton"
                    ).textContent = "Simpan Perubahan";

                    document.getElementById("progressDate").value =
                        progress.date;

                    document.getElementById("progressPhoto").value = "";

                    document.getElementById("progressNote").value =
                        progress.note;

                    document.getElementById(
                        "continueProgressForm"
                    ).style.display = "block";
                });
            }
        );

        journalCard.querySelectorAll(".delete-progress-button").forEach(
            function (button) {
                button.addEventListener("click", function () {
                    const confirmDelete = confirm(
                        "Yakin ingin menghapus riwayat perkembangan ini?"
                    );

                    if (!confirmDelete) {
                        return;
                    }

                    const latestJournals =
                        JSON.parse(localStorage.getItem("journals")) || [];

                    const journalIndex = latestJournals.findIndex(
                        function (item) {
                            return item.id === journal.id;
                        }
                    );

                    if (journalIndex === -1) {
                        alert("Jurnal tidak ditemukan.");
                        return;
                    }

                    latestJournals[journalIndex].progressHistory.splice(
                        Number(button.dataset.index), 1
                    );

                    localStorage.setItem(
                        "journals",
                        JSON.stringify(latestJournals)
                    );

                    displayJournals();
                });
            }
        );

        journalList.appendChild(journalCard);
    });

    localStorage.setItem("journals", JSON.stringify(journals));
}

displayJournals();


document.getElementById("closeProgressFormButton")
    .addEventListener("click", function () {

        document.getElementById("continueProgressForm").style.display = "none";

        document.getElementById("progressDate").value = "";
        document.getElementById("progressPhoto").value = "";
        document.getElementById("progressNote").value = "";

        document.querySelector(
            "#continueProgressForm h3"
        ).textContent = "Perkembangan Tanaman 🌿";

        document.getElementById(
            "saveProgressButton"
        ).textContent = "Simpan Progres";

        selectedJournalId = null;
        selectedProgressIndex = null;
    });


document.getElementById("saveProgressButton")
    .addEventListener("click", function () {
        const progressDate =
            document.getElementById("progressDate").value;

        const progressPhoto =
            document.getElementById("progressPhoto").files[0];

        const progressNote =
            document.getElementById("progressNote").value.trim();

        if (!progressDate || !progressNote) {
            alert("Mohon isi tanggal dan catatan perkembangan.");
            return;
        }

        const journals =
            JSON.parse(localStorage.getItem("journals")) || [];

        const journal = journals.find(function (item) {
            return item.id === selectedJournalId;
        });

        if (!journal) {
            alert("Jurnal tanaman tidak ditemukan.");
            return;
        }

        if (!Array.isArray(journal.progressHistory)) {
            journal.progressHistory = [];
        }

        function finishSavingProgress(photoData) {
            const progressData = {
                date: progressDate,
                photo: photoData,
                note: progressNote
            };

            if (selectedProgressIndex !== null) {
                journal.progressHistory[selectedProgressIndex] =
                    progressData;
            } else {
                journal.progressHistory.push(progressData);
            }

            localStorage.setItem("journals", JSON.stringify(journals));

            alert(
                selectedProgressIndex !== null
                    ? "Perkembangan berhasil diperbarui!"
                    : "Progres tanaman berhasil disimpan!"
            );

            document.getElementById(
                "continueProgressForm"
            ).style.display = "none";

            document.getElementById("progressDate").value = "";
            document.getElementById("progressPhoto").value = "";
            document.getElementById("progressNote").value = "";

            document.querySelector(
                "#continueProgressForm h3"
            ).textContent = "Perkembangan Tanaman 🌿";

            document.getElementById(
                "saveProgressButton"
            ).textContent = "Simpan Progres";

            selectedJournalId = null;
            selectedProgressIndex = null;

            displayJournals();
        }

        if (progressPhoto) {
            const reader = new FileReader();

            reader.onload = function () {
                finishSavingProgress(reader.result);
            };

            reader.readAsDataURL(progressPhoto);
        } else {
            let oldPhoto = null;

            if (selectedProgressIndex !== null) {
                oldPhoto =
                    journal.progressHistory[selectedProgressIndex].photo || null;
            }

            finishSavingProgress(oldPhoto);
        }
    });


let selectedHealthPlantId = null;

const healthDetails = {
    sehat: {
        title: "🟢 Sehat",

        explanation:
            "Tanaman terlihat segar, batang cukup kokoh, dan daunnya tumbuh dengan baik. Beberapa daun tua yang menguning secara alami adalah hal yang wajar.",
        causes:
            "Kondisi tanaman kemungkinan cukup baik karena kebutuhan air, cahaya, dan unsur hara terpenuhi secara seimbang.",
        care:
            "1. Periksa tanah sebelum menyiram. Sentuh tanah sedalam sekitar 2-3 cm dengan jari. Jika terasa agak kering, siram secukupnya.",
        avoid:
            "Jangan menyiram atau memberi pupuk secara berlebihan.",
        tips:
            "Periksa kondisi daun dan tanah secara rutin. Catat pertumbuhan tanaman di Jurnal PlantPal."
    },

    menguning: {
        title: "🟡 Daun Menguning",

        explanation:
            "Perhatikan bagian daun yang menguning. Jika hanya satu atau dua daun tua di bagian bawah, hal tersebut bisa jadi proses alami.",
        causes:
            "Kemungkinan penyebabnya antara lain tanah terlalu basah, kekurangan air, pencahayaan kurang, atau kekurangan nutrisi.",
        care:
            "1. Sentuh tanah sedalam sekitar 2-3 cm. 2. Jika tanah masih basah, jangan langsung menyiram. Biarkan media tanam agak mengering.",
        avoid:
            "Jangan langsung menambah air atau pupuk tanpa memeriksa kondisi tanaman.",
        tips:
            "Amati daun yang menguning dan periksa kondisi tanah. Catat perubahan yang terjadi."
    },

    layu: {
        title: "💧 Layu",

        explanation:
            "Daun atau batang terlihat lemas dan tidak sekokoh biasanya. Tanaman yang layu bisa menjadi tanda stres akibat air atau akar.",
        causes:
            "Kemungkinan penyebabnya adalah tanah terlalu kering, penyiraman berlebihan, akar membusuk, atau masalah pada pencahayaan.",
        care:
            "1. Periksa tanah dengan jari sedalam sekitar 2-3 cm. 2. Jika tanah kering, siram hingga lembap. Jika tanah terlalu basah, berhentikan penyiraman sementara.",
        avoid:
            "Jangan langsung menyiram berulang kali jika tanah masih basah.",
        tips:
            "Periksa tanah dengan menyentuh permukaannya. Jika kering, sesuaikan penyiraman dengan kebutuhan tanaman."
    },

    hama: {
        title: "🐛 Serangan Hama",

        explanation:
            "Perhatikan apakah ada serangga kecil, lubang pada daun, daun menggulung, atau lapisan lengket/bertepung.",
        causes:
            "Kemungkinan penyebabnya adalah kutu daun, kutu putih, tungau, ulat, atau hama lainnya.",
        care:
            "1. Periksa bagian bawah daun, batang, dan pucuk tanaman. 2. Jika memungkinkan, bersihkan hama secara manual atau potong bagian terinfeksi parah.",
        avoid:
            "Jangan menggunakan pembasmi hama sembarangan.",
        tips:
            "Periksa bagian atas dan bawah daun. Catat atau foto tanda hama agar perubahannya dapat terpantau."
    },

    bercak: {
        title: "🍃 Daun Rusak / Bercak",

        explanation:
            "Daun dapat memiliki bercak cokelat atau hitam, bagian kering, lubang, maupun tepung mengering/jamur.",
        causes:
            "Kemungkinan penyebabnya meliputi paparan matahari yang terlalu kuat, masalah kelembapan, penyakit jamur, atau infeksi bakteri.",
        care:
            "1. Periksa apakah bercak hanya terdapat pada satu daun atau menyebar ke daun lain. 2. Pastikan sirkulasi udara di sekitar tanaman lancar.",
        avoid:
            "Jangan langsung menggunakan obat tanaman tanpa mengetahui penyebab bercak.",
        tips:
            "Foto bercak yang ditemukan dan amati apakah bertambah luas atau muncul di daun lain."
    }
};

const healthConditionContainer =
    document.getElementById("healthConditionContainer");

const healthCondition =
    document.getElementById("healthCondition");

const healthConditionDetail =
    document.getElementById("healthConditionDetail");

const saveHealthButton =
    document.getElementById("saveHealthButton");


function showHealthDetails() {
    const condition = healthDetails[healthCondition.value];

    if (!condition) {
        healthConditionDetail.style.setProperty("display", "none", "important");
        return;
    }

    document.getElementById("healthDetailTitle").textContent =
        condition.title;

    document.getElementById("healthExplanation").textContent =
        condition.explanation;

    document.getElementById("healthCauses").textContent =
        condition.causes;

    document.getElementById("healthCareTips").textContent =
        condition.care;

    document.getElementById("healthThingsToAvoid").textContent =
        condition.avoid;

    document.getElementById("healthBeginnerTips").textContent =
        condition.tips;

    healthConditionDetail.style.setProperty("display", "block", "important");
}

function displayHealthPlants() {
    const healthPlantList =
        document.getElementById("healthPlantList");

    const emptyHealthMessage =
        document.getElementById("emptyHealthMessage");

    const plants =
        JSON.parse(localStorage.getItem("plants")) || [];

    healthPlantList.innerHTML = "";

    if (plants.length === 0) {
        emptyHealthMessage.style.display = "block";
        healthConditionContainer.style.display = "none";
        selectedHealthPlantId = null;
        return;
    }

    emptyHealthMessage.style.display = "none";

    plants.forEach(function (plant) {
        const healthCard = document.createElement("div");
        healthCard.className = "health-card";

        const plantTitle = document.createElement("h3");
        plantTitle.textContent = "🌱 " + plant.name;

        const savedStatus = document.createElement("p");
        savedStatus.textContent =
            "Status: " +
            (healthDetails[plant.healthStatus]
                ? healthDetails[plant.healthStatus].title
                : "Belum dicatat");

        const selectPlantButton = document.createElement("button");
        selectPlantButton.textContent = "Pilih Tanaman";

        
        selectPlantButton.addEventListener("click", function () {
            selectedHealthPlantId = plant.id;

                healthConditionContainer.classList.add("health-popup");
                healthConditionContainer.style.display = "block";

            document.getElementById("healthPlantTitle").textContent =
                "Kondisi Tanaman: " + plant.name;

            healthCondition.value = healthDetails[plant.healthStatus]
                ? plant.healthStatus
            : "";

            showHealthDetails();
        });


        healthCard.appendChild(plantTitle);
        healthCard.appendChild(savedStatus);
        healthCard.appendChild(selectPlantButton);

        healthPlantList.appendChild(healthCard);
    });

    if (selectedHealthPlantId !== null) {
        const selectedPlant = plants.find(function (plant) {
            return plant.id === selectedHealthPlantId;
        });

        if (selectedPlant) {
            document.getElementById("healthPlantTitle").textContent =
                "Kondisi Tanaman: " + selectedPlant.name;

            healthConditionContainer.style.display = "block";
            healthCondition.value = healthDetails[selectedPlant.healthStatus]
                ? selectedPlant.healthStatus
                : "";

            showHealthDetails();
        } else {
            selectedHealthPlantId = null;
            healthConditionContainer.style.display = "none";
        }
    } else {
        healthConditionContainer.style.display = "none";
    }
}

healthCondition.addEventListener("change", showHealthDetails);

saveHealthButton.addEventListener("click", function () {
    if (selectedHealthPlantId === null) {
        alert("Pilih tanaman terlebih dahulu.");
        return;
    }

    if (!healthDetails[healthCondition.value]) {
        alert("Silakan pilih kondisi kesehatan tanaman.");
        return;
    }

    const plants =
        JSON.parse(localStorage.getItem("plants")) || [];

    const plantIndex = plants.findIndex(function (plant) {
        return plant.id === selectedHealthPlantId;
    });

    if (plantIndex === -1) {
        alert("Data tanaman tidak ditemukan.");
        return;
    }

    plants[plantIndex].healthStatus = healthCondition.value;

    localStorage.setItem("plants", JSON.stringify(plants));

    alert("Status kesehatan berhasil disimpan!");

    selectedHealthPlantId = null;
    healthCondition.value = "";
    healthConditionDetail.style.display = "none";
    healthConditionContainer.style.display = "none";

    displayHealthPlants();

});

healthMenuButton.addEventListener("click", function () {
    displayHealthPlants();
});


document.getElementById("closeHealthPopupButton")
    .addEventListener("click", function () {
        healthConditionContainer.style.display = "none";
        selectedHealthPlantId = null;
        healthCondition.value = "";
        healthConditionDetail.style.display = "none";
    });

plantMenuButton.addEventListener("click", function () {
    healthConditionContainer.style.display = "none";
});

journalMenuButton.addEventListener("click", function () {
    healthConditionContainer.style.display = "none";
});

guideMenuButton.addEventListener("click", function () {
    healthConditionContainer.style.display = "none";
});

const guideList = document.getElementById("guideList");

const plantGuides = [
    {
        icon: "💧",
        title: "1. Panduan Penyiraman Tanaman",
        description: `
            <strong>Tujuan:</strong>
            Menjaga kelembapan tanah agar akar dapat menyerap air dengan baik.

            <br><br><strong>Cara Perawatan:</strong>
            <br>• Periksa kelembapan tanah sebelum menyiram.
            <br>• Siram tanah secara merata hingga air mulai keluar dari lubang drainase.
            <br>• Sesuaikan frekuensi penyiraman dengan jenis tanaman, ukuran pot, dan cuaca.
            <br>• Pastikan pot memiliki lubang drainase agar air tidak menggenang.

            <br><br><strong>Tanda Tanaman Kekurangan Air:</strong>
            <br>Daun layu, tanah sangat kering, dan daun dapat mengering.

            <br><br><strong>Yang Perlu Dihindari:</strong>
            <br>Jangan menyiram hanya berdasarkan jadwal tanpa memeriksa kondisi tanah. Penyiraman berlebihan dapat menyebabkan akar kekurangan oksigen dan membusuk.
        `
    },
    {
        icon: "☀️",
        title: "2. Panduan Pencahayaan",
        description: `
            <strong>Tujuan:</strong>
            Membantu tanaman memperoleh cahaya yang dibutuhkan untuk fotosintesis.

            <br><br><strong>Cara Perawatan:</strong>
            <br>• Kenali kebutuhan cahaya setiap jenis tanaman.
            <br>• Letakkan tanaman sesuai kebutuhan sinar mataharinya.
            <br>• Putar posisi pot sesekali jika tanaman menerima cahaya dari satu arah.
            <br>• Kenalkan tanaman pada sinar matahari yang lebih kuat secara bertahap.

            <br><br><strong>Tanda Kekurangan Cahaya:</strong>
            <br>Pertumbuhan memanjang, batang lemah, atau daun baru berukuran kecil.

            <br><br><strong>Yang Perlu Dihindari:</strong>
            <br>Jangan langsung memindahkan tanaman yang terbiasa di tempat teduh ke terik matahari karena daunnya dapat terbakar.
        `
    },
    {
        icon: "🧪",
        title: "3. Panduan Pemupukan",
        description: `
            <strong>Tujuan:</strong>
            Membantu memenuhi kebutuhan unsur hara untuk pertumbuhan tanaman.

            <br><br><strong>Cara Perawatan:</strong>
            <br>• Pilih pupuk yang sesuai dengan jenis tanaman.
            <br>• Ikuti dosis dan petunjuk penggunaan pada kemasan.
            <br>• Perhatikan kondisi tanaman dan media tanam sebelum memberi pupuk.
            <br>• Catat tanggal pemupukan di PlantPal agar jadwal perawatan mudah dipantau.

            <br><br><strong>Tanda Pemupukan Berlebihan:</strong>
            <br>Ujung daun mengering, daun berubah warna, atau pertumbuhan terganggu.

            <br><br><strong>Yang Perlu Dihindari:</strong>
            <br>Jangan menambahkan pupuk melebihi dosis yang dianjurkan. Hindari memupuk tanaman yang sedang mengalami kekeringan berat.
        `
    },
    {
        icon: "🐛",
        title: "4. Panduan Mengatasi Hama",
        description: `
            <strong>Tujuan:</strong>
            Menjaga tanaman dari organisme pengganggu yang dapat merusak daun, batang, dan bagian lainnya.

            <br><br><strong>Cara Perawatan:</strong>
            <br>• Periksa bagian bawah daun, batang, dan tunas secara berkala.
            <br>• Pisahkan sementara tanaman yang diduga terserang hama.
            <br>• Bersihkan hama ringan secara manual jika memungkinkan.
            <br>• Kenali jenis hama sebelum memilih cara penanganan.
            <br>• Jika memakai produk pengendali hama, ikuti label dan petunjuk keselamatannya.

            <br><br><strong>Tanda Serangan Hama:</strong>
            <br>Lubang pada daun, bercak tidak biasa, daun menggulung, atau terlihatnya serangga kecil.

            <br><br><strong>Yang Perlu Dihindari:</strong>
            <br>Jangan langsung menggunakan bahan kimia tanpa mengetahui penyebab masalah tanaman.
        `
    },
    {
        icon: "🍃",
        title: "5. Panduan Mengatasi Daun Menguning",
        description: `
            <strong>Kemungkinan Penyebab:</strong>
            <br>Daun menguning dapat disebabkan oleh penyiraman berlebihan, kekurangan air, pencahayaan yang tidak sesuai, kekurangan unsur hara, atau proses penuaan daun.

            <br><br><strong>Cara Mengatasi:</strong>
            <br>• Periksa kelembapan dan kondisi tanah.
            <br>• Pastikan air dapat mengalir keluar dari pot.
            <br>• Evaluasi pencahayaan di tempat tanaman diletakkan.
            <br>• Periksa apakah perubahan warna terjadi pada satu daun atau banyak daun.
            <br>• Amati perkembangan tanaman setelah perawatan disesuaikan.

            <br><br><strong>Yang Perlu Dihindari:</strong>
            <br>Jangan langsung menambahkan pupuk hanya karena daun menguning. Cari kemungkinan penyebabnya terlebih dahulu.
        `
    },
    {
        icon: "🌱",
        title: "6. Panduan Mengatasi Tanaman Layu",
        description: `
            <strong>Kemungkinan Penyebab:</strong>
            <br>Tanaman layu dapat mengalami kekurangan air, kelebihan air, kerusakan akar, atau tekanan akibat suhu yang terlalu tinggi.

            <br><br><strong>Cara Mengatasi:</strong>
            <br>• Periksa kelembapan tanah sebelum menambahkan air.
            <br>• Jika tanah sangat kering, siram secara merata sesuai kebutuhan tanaman.
            <br>• Jika tanah terus basah, periksa drainase dan kondisi akar.
            <br>• Pindahkan tanaman dari kondisi panas berlebihan jika diperlukan.
            <br>• Amati apakah tanaman kembali segar setelah penyebabnya ditangani.

            <br><br><strong>Yang Perlu Dihindari:</strong>
            <br>Jangan langsung menyiram tanaman layu tanpa memeriksa tanah karena penyebabnya belum tentu kekurangan air.
        `
    },
    {
        icon: "🌷",
        title: "7. Panduan Memilih Pot dan Media Tanam",
        description: `
            <strong>Tujuan:</strong>
            Menyediakan ruang tumbuh, air, udara, dan unsur hara yang dibutuhkan akar.

            <br><br><strong>Cara Perawatan:</strong>
            <br>• Pilih pot dengan ukuran yang sesuai dengan tanaman.
            <br>• Gunakan pot yang memiliki lubang drainase.
            <br>• Pilih media tanam sesuai kebutuhan jenis tanaman.
            <br>• Pastikan media tanam tidak terlalu padat dan tetap memiliki sirkulasi udara yang baik.
            <br>• Periksa apakah akar sudah memenuhi pot sebelum mempertimbangkan pemindahan.

            <br><br><strong>Yang Perlu Dihindari:</strong>
            <br>Jangan memilih pot yang terlalu besar tanpa mempertimbangkan kebutuhan tanaman karena media yang terlalu lama basah dapat meningkatkan risiko masalah akar.
        `
    },
    {
        icon: "✂️",
        title: "8. Panduan Memangkas Tanaman",
        description: `
            <strong>Tujuan:</strong>
            Membantu menjaga bentuk tanaman dan membuang bagian yang mati atau rusak.

            <br><br><strong>Cara Perawatan:</strong>
            <br>• Gunakan alat pemangkas yang bersih dan tajam.
            <br>• Potong daun atau batang yang mati dan rusak sesuai jenis tanamannya.
            <br>• Pelajari cara pemangkasan yang tepat sebelum memotong batang utama.
            <br>• Bersihkan alat setelah digunakan, terutama jika tanaman menunjukkan gejala penyakit.

            <br><br><strong>Yang Perlu Dihindari:</strong>
            <br>Jangan memangkas terlalu banyak bagian tanaman sekaligus karena tanaman membutuhkan daun untuk menghasilkan energi.
        `
    },
    {
        icon: "📖",
        title: "9. Panduan Mencatat Perkembangan Tanaman",
        description: `
            <strong>Tujuan:</strong>
            Membantu memantau perubahan tanaman dan mengevaluasi perawatannya dari waktu ke waktu.

            <br><br><strong>Cara Menggunakan PlantPal:</strong>
            <br>• Tambahkan tanaman melalui menu Tanaman.
            <br>• Catat tanggal penyiraman dan pemupukan sesuai kebutuhan.
            <br>• Gunakan menu Jurnal untuk menyimpan foto dan catatan perkembangan.
            <br>• Pilih tingkat progress untuk membantu menggambarkan perkembangan yang dicatat.
            <br>• Gunakan menu Status Kesehatan untuk mencatat kondisi tanaman.
            <br>• Bandingkan catatan dan foto dari waktu ke waktu.

            <br><br><strong>Tips:</strong>
            <br>Catat perubahan yang benar-benar diamati, seperti munculnya daun baru, perubahan warna, atau pertumbuhan tunas.
        `
    }
];


const guideSelect = document.getElementById("guideSelect");
const selectedGuide = document.getElementById("selectedGuide");

function displayGuides() {
    guideSelect.innerHTML = `
        <option value="">-- Pilih Panduan --</option>
    `;

    plantGuides.forEach(function (guide, index) {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = guide.title;
        guideSelect.appendChild(option);
    });

    guideList.innerHTML = "";
}

guideSelect.addEventListener("change", function () {
    selectedGuide.innerHTML = "";

    if (guideSelect.value === "") {
        return;
    }

    const guide = plantGuides[Number(guideSelect.value)];

    const guideCard = document.createElement("div");
    guideCard.className = "guide-card";

    guideCard.innerHTML = `
        <div class="guide-icon">${guide.icon}</div>
        <div class="guide-content">
            <h3>${guide.title}</h3>
            <div class="guide-description-text">
                ${guide.description}
            </div>
        </div>
    `;

    selectedGuide.appendChild(guideCard);
});

displayGuides();
