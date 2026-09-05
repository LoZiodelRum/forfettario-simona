const STORAGE_KEY = "forfettario_simona_architetto_v1";

function euro(n) {
  return Number(n || 0).toLocaleString("it-IT", {
    style: "currency",
    currency: "EUR"
  });
}

function parseAmount(value) {
  if (typeof value !== "string") return Number(value) || 0;

  let clean = value
    .trim()
    .replace(/\s/g, "")
    .replace(/€/g, "");

  if (!clean) return 0;

  if (clean.includes(",") && clean.includes(".")) {
    clean = clean.replace(/\./g, "").replace(",", ".");
  } else if (clean.includes(",")) {
    clean = clean.replace(",", ".");
  }

  const number = Number(clean);

  return Number.isFinite(number)
    ? Math.max(0, number)
    : 0;
}

function calculate(gross) {
  const taxableGross = gross * 0.78;
  const inarcassaSubjective = taxableGross * 0.145;
  const inarcassaIntegrative = gross * 0.04;

  const taxableNet = Math.max(
    0,
    taxableGross - inarcassaSubjective
  );

  const tax = taxableNet * 0.15;

  const netTaxable = Math.max(
    0,
    taxableGross - inarcassaSubjective - tax
  );

  const exemptQuota = gross * 0.22;

  const netEarnings =
    netTaxable + exemptQuota;

  const invoiceTotalWith4 =
    gross + inarcassaIntegrative;

  return {
    gross,
    taxableGross,
    inarcassaSubjective,
    inarcassaIntegrative,
    taxableNet,
    tax,
    netTaxable,
    exemptQuota,
    netEarnings,
    invoiceTotalWith4
  };
}

function getInvoices() {
  try {
    const data = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );

    return Array.isArray(data)
      ? data
      : [];

  } catch (error) {
    return [];
  }
}

function setInvoices(invoices) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(invoices)
  );
}

const amountInput =
  document.getElementById("invoiceAmount");

const descriptionInput =
  document.getElementById("invoiceDescription");

const saveInvoiceBtn =
  document.getElementById("saveInvoiceBtn");

const fields = {
  taxableGross:
    document.getElementById("taxableGross"),

  inarcassaSubjective:
    document.getElementById("inarcassaSubjective"),

  inarcassaIntegrative:
    document.getElementById("inarcassaIntegrative"),

  taxableNet:
    document.getElementById("taxableNet"),

  tax:
    document.getElementById("tax"),

  netTaxable:
    document.getElementById("netTaxable"),

  exemptQuota:
    document.getElementById("exemptQuota"),

  netEarnings:
    document.getElementById("netEarnings"),

  invoiceTotalWith4:
    document.getElementById("invoiceTotalWith4")
};

function updateCurrent() {
  const gross =
    parseAmount(amountInput.value);

  const c =
    calculate(gross);

  fields.taxableGross.textContent =
    euro(c.taxableGross);

  fields.inarcassaSubjective.textContent =
    euro(c.inarcassaSubjective);

  fields.inarcassaIntegrative.textContent =
    euro(c.inarcassaIntegrative);

  fields.taxableNet.textContent =
    euro(c.taxableNet);

  fields.tax.textContent =
    euro(c.tax);

  fields.netTaxable.textContent =
    euro(c.netTaxable);

  fields.exemptQuota.textContent =
    euro(c.exemptQuota);

  fields.netEarnings.textContent =
    euro(c.netEarnings);

  fields.invoiceTotalWith4.textContent =
    euro(c.invoiceTotalWith4);
}

amountInput.addEventListener(
  "input",
  updateCurrent
);

saveInvoiceBtn.addEventListener(
  "click",
  function () {

    const gross =
      parseAmount(amountInput.value);

    if (gross <= 0) {
      alert(
        "Inserisci un importo fatturato maggiore di zero."
      );

      amountInput.focus();

      return;
    }

    const description =
      descriptionInput.value.trim();

    const c =
      calculate(gross);

    const invoice = {
      id: Date.now(),
      date: new Date().toISOString(),
      description:
        description ||
        "Prestazione professionale",
      ...c
    };

    const invoices =
      getInvoices();

    invoices.unshift(invoice);

    setInvoices(invoices);

    amountInput.value = "";
    descriptionInput.value = "";

    updateCurrent();
    updateTotals();
    renderInvoices();

    saveInvoiceBtn.textContent =
      "FATTURA REGISTRATA ✓";

    setTimeout(() => {
      saveInvoiceBtn.textContent =
        "REGISTRA FATTURA";
    }, 1200);
  }
);

function updateTotals() {
  const invoices =
    getInvoices();

  const totals =
    invoices.reduce(
      (acc, inv) => {

        acc.gross +=
          Number(inv.gross || 0);

        acc.subjective +=
          Number(
            inv.inarcassaSubjective || 0
          );

        acc.integrative +=
          Number(
            inv.inarcassaIntegrative || 0
          );

        acc.tax +=
          Number(inv.tax || 0);

        acc.net +=
          Number(inv.netEarnings || 0);

        return acc;
      },
      {
        gross: 0,
        subjective: 0,
        integrative: 0,
        tax: 0,
        net: 0
      }
    );

  document.getElementById(
    "totalGross"
  ).textContent =
    euro(totals.gross);

  document.getElementById(
    "totalSubjective"
  ).textContent =
    euro(totals.subjective);

  document.getElementById(
    "totalIntegrative"
  ).textContent =
    euro(totals.integrative);

  document.getElementById(
    "totalTax"
  ).textContent =
    euro(totals.tax);

  // Totale Accantonamenti:
  // contributo soggettivo Inarcassa
  // + contributo integrativo 4%
  // + imposta sostitutiva
  const totalReserve =
    totals.subjective +
    totals.integrative +
    totals.tax;

  document.getElementById(
    "totalReserve"
  ).textContent =
    euro(totalReserve);

  document.getElementById(
    "totalNet"
  ).textContent =
    euro(totals.net);
}

function renderInvoices() {
  const invoices =
    getInvoices();

  const list =
    document.getElementById(
      "invoiceList"
    );

  const empty =
    document.getElementById(
      "emptyState"
    );

  list.innerHTML = "";

  empty.style.display =
    invoices.length
      ? "none"
      : "block";

  invoices.forEach(inv => {

    const row =
      document.createElement(
        "article"
      );

    row.className =
      "invoice-row";

    const date =
      new Date(inv.date);

    const dateText =
      Number.isNaN(
        date.getTime()
      )
        ? ""
        : date.toLocaleDateString(
            "it-IT"
          );

    row.innerHTML = `
      <div class="invoice-top">
        <div>
          <div class="date">
            ${dateText}
          </div>

          <h3>
            Fattura registrata
          </h3>
        </div>

        <div class="gross">
          ${euro(inv.gross)}
        </div>
      </div>

      <div class="desc">
        ${escapeHtml(
          inv.description || ""
        )}
      </div>

      <div class="invoice-values">

        <div>
          <span>
            Imponibile lordo
          </span>

          <strong>
            ${euro(
              inv.taxableGross
            )}
          </strong>
        </div>

        <div>
          <span>
            Inarcassa 14,5%
          </span>

          <strong>
            ${euro(
              inv.inarcassaSubjective
            )}
          </strong>
        </div>

        <div>
          <span>
            Inarcassa 4%
          </span>

          <strong>
            ${euro(
              inv.inarcassaIntegrative
            )}
          </strong>
        </div>

        <div>
          <span>
            Imponibile netto
          </span>

          <strong>
            ${euro(
              inv.taxableNet
            )}
          </strong>
        </div>

        <div>
          <span>
            Imposta 15%
          </span>

          <strong>
            ${euro(
              inv.tax
            )}
          </strong>
        </div>

        <div>
          <span>
            Quota esente
          </span>

          <strong>
            ${euro(
              inv.exemptQuota
            )}
          </strong>
        </div>

        <div>
          <span>
            Guadagno netto
          </span>

          <strong>
            ${euro(
              inv.netEarnings
            )}
          </strong>
        </div>

        <div>
          <span>
            Totale con 4%
          </span>

          <strong>
            ${euro(
              inv.invoiceTotalWith4
            )}
          </strong>
        </div>

      </div>

      <button
        class="delete-invoice"
        data-id="${inv.id}"
      >
        Elimina fattura
      </button>
    `;

    list.appendChild(row);
  });

  document
    .querySelectorAll(
      ".delete-invoice"
    )
    .forEach(btn => {

      btn.addEventListener(
        "click",
        function () {

          const id =
            Number(
              this.dataset.id
            );

          if (
            !confirm(
              "Vuoi eliminare questa fattura dall’archivio?"
            )
          ) {
            return;
          }

          const updated =
            getInvoices().filter(
              inv =>
                Number(inv.id) !== id
            );

          setInvoices(updated);

          renderInvoices();
          updateTotals();
        }
      );
    });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const dashboardView =
  document.getElementById(
    "dashboardView"
  );

const invoicesView =
  document.getElementById(
    "invoicesView"
  );

const dashboardTab =
  document.getElementById(
    "dashboardTab"
  );

const invoicesTab =
  document.getElementById(
    "invoicesTab"
  );

function showView(name) {
  const dashboard =
    name === "dashboard";

  dashboardView.classList.toggle(
    "active",
    dashboard
  );

  invoicesView.classList.toggle(
    "active",
    !dashboard
  );

  dashboardTab.classList.toggle(
    "active",
    dashboard
  );

  invoicesTab.classList.toggle(
    "active",
    !dashboard
  );

  if (!dashboard) {
    renderInvoices();
  }
}

dashboardTab.addEventListener(
  "click",
  () => showView("dashboard")
);

invoicesTab.addEventListener(
  "click",
  () => showView("invoices")
);

document
  .getElementById(
    "clearAllBtn"
  )
  .addEventListener(
    "click",
    function () {

      const invoices =
        getInvoices();

      if (!invoices.length) {
        return;
      }

      if (
        !confirm(
          "Vuoi cancellare definitivamente tutte le fatture registrate?"
        )
      ) {
        return;
      }

      setInvoices([]);

      renderInvoices();
      updateTotals();
    }
  );

updateCurrent();
updateTotals();
renderInvoices();
