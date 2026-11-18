
const cidadeInput = document.getElementById("cidade");
const buscarBtn = document.getElementById("buscar");
const localizacaoBtn = document.getElementById("localizacao");
const mensagem = document.getElementById("mensagem");

function interpretarClima(codigo) {
    const climas = {
        0: ["Céu limpo", "☀️"],
        1: ["Predominantemente limpo", "🌤️"],
        2: ["Parcialmente nublado", "⛅"],
        3: ["Nublado", "☁️"],
        45: ["Neblina", "🌫️"],
        48: ["Neblina com geada", "🌫️"],
        51: ["Garoa fraca", "🌦️"],
        53: ["Garoa moderada", "🌦️"],
        55: ["Garoa intensa", "🌧️"],
        61: ["Chuva fraca", "🌧️"],
        63: ["Chuva moderada", "🌧️"],
        65: ["Chuva forte", "🌧️"],
        71: ["Neve fraca", "🌨️"],
        73: ["Neve moderada", "🌨️"],
        75: ["Neve forte", "❄️"],
        80: ["Pancadas de chuva", "🌦️"],
        81: ["Chuva forte", "🌧️"],
        82: ["Chuva muito forte", "⛈️"],
        95: ["Tempestade", "⛈️"],
        96: ["Tempestade com granizo", "⛈️"],
        99: ["Tempestade forte com granizo", "⛈️"]
    };

    return climas[codigo] || ["Condição desconhecida", "🌤️"];
}

function formatarDia(data) {
    return new Date(data + "T12:00:00")
        .toLocaleDateString("pt-BR", {
            weekday: "short"
        })
        .replace(".", "");
}

async function pesquisarCidade(nome) {
    if (!nome.trim()) {
        mensagem.textContent = "Digite o nome de uma cidade.";
        return;
    }

    try {
        mensagem.textContent = "Buscando cidade...";
        buscarBtn.disabled = true;

        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(nome)}&count=1&language=pt&format=json`;

        const resposta = await fetch(url);

        if (!resposta.ok) {
            throw new Error("Erro ao pesquisar cidade.");
        }

        const dados = await resposta.json();

        if (!dados.results || dados.results.length === 0) {
            throw new Error("Cidade não encontrada.");
        }

        const cidade = dados.results[0];

        await buscarClima(
            cidade.latitude,
            cidade.longitude,
            cidade.name,
            cidade.country
        );

    } catch (erro) {
        mensagem.textContent = erro.message;
    } finally {
        buscarBtn.disabled = false;
    }
}

async function buscarClima(latitude, longitude, nome, pais) {
    try {
        mensagem.textContent = "Atualizando previsão...";

        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=7&timezone=auto`;

        const resposta = await fetch(url);

        if (!resposta.ok) {
            throw new Error("Não foi possível consultar o clima.");
        }

        const dados = await resposta.json();

        mostrarClima(dados, nome, pais);

        mensagem.textContent = "";

    } catch (erro) {
        mensagem.textContent = erro.message;
    }
}

function mostrarClima(dados, nome, pais) {
    const atual = dados.current;
    const diaria = dados.daily;

    document.getElementById("nomeCidade").textContent =
        `${nome}, ${pais}`;

    const dataAtual = new Date(atual.time);

    document.getElementById("data").textContent =
        dataAtual.toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "numeric",
            month: "long"
        });

    const clima = interpretarClima(atual.weather_code);

    document.getElementById("icone").textContent = clima[1];

    document.getElementById("temperatura").textContent =
        `${Math.round(atual.temperature_2m)}°C`;

    document.getElementById("descricao").textContent = clima[0];

    document.getElementById("umidade").textContent =
        `${atual.relative_humidity_2m}%`;

    document.getElementById("vento").textContent =
        `${atual.wind_speed_10m} km/h`;

    document.getElementById("sensacao").textContent =
        `${Math.round(atual.apparent_temperature)}°C`;

    const diasContainer = document.getElementById("dias");

    diasContainer.innerHTML = "";

    diaria.time.forEach((dia, indice) => {
        const climaDia = interpretarClima(
            diaria.weather_code[indice]
        );

        const elemento = document.createElement("div");
        elemento.className = "dia";

        const diaNome = indice === 0
            ? "Hoje"
            : formatarDia(dia);

        elemento.innerHTML = `
            <p>${diaNome}</p>
            <div class="dia-icone">${climaDia[1]}</div>
            <strong>
                ${Math.round(diaria.temperature_2m_max[indice])}°
                /
                ${Math.round(diaria.temperature_2m_min[indice])}°
            </strong>
            <small>
                🌧️ ${diaria.precipitation_probability_max[indice] ?? "--"}% chuva
            </small>
        `;

        diasContainer.appendChild(elemento);
    });
}

// Pesquisar pelo botão
buscarBtn.addEventListener("click", () => {
    pesquisarCidade(cidadeInput.value);
});

// Pesquisar apertando Enter
cidadeInput.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter") {
        pesquisarCidade(cidadeInput.value);
    }
});

// Localização do usuário
localizacaoBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
        mensagem.textContent =
            "Seu navegador não suporta localização.";
        return;
    }

    mensagem.textContent = "Obtendo sua localização...";

    navigator.geolocation.getCurrentPosition(
        async (posicao) => {
            const latitude = posicao.coords.latitude;
            const longitude = posicao.coords.longitude;

            await buscarClima(
                latitude,
                longitude,
                "Minha localização",
                ""
            );
        },
        () => {
            mensagem.textContent =
                "Não foi possível acessar sua localização. Verifique a permissão do navegador.";
        }
    );
});

// Carregar uma cidade inicial
pesquisarCidade("São Paulo");
