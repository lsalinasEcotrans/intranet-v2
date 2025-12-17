export default function TestPage() {
  return (
    <>
      <table
        style={{
          fontFamily: "Arial, sans-serif",
          fontSize: "12px",
          color: "#333",
          borderCollapse: "collapse",
          width: "600px",
        }}
      >
        <tbody>
          {/* Fila del logo y datos principales */}
          <tr>
            <td
              style={{
                width: "40%",
                paddingRight: "10px",
                verticalAlign: "top",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "16px",
                  fontWeight: "bold",
                  color: "#0a6e3f",
                }}
              >
                %%DisplayName%%
              </p>

              <p
                style={{
                  margin: 0,
                  fontSize: "12px",
                  color: "#555",
                }}
              >
                %%Title%% | %%Department%%
              </p>

              <img
                src="https://www.ecotranschile.cl/img/logoEcotrans_50px.png"
                alt="Logo Ecotrans"
                style={{ height: "50px" }}
              />
            </td>

            <td
              style={{
                width: "60%",
                borderLeft: "2px solid #0a6e3f",
                paddingLeft: "10px",
                verticalAlign: "top",
              }}
            >
              <p style={{ margin: 0, fontSize: "12px", color: "#555" }}>
                %%Company%%
              </p>

              <p style={{ margin: 0, fontSize: "12px", color: "#555" }}>
                📞 %%PhoneNumber%%
              </p>

              <p style={{ margin: 0, fontSize: "12px", color: "#555" }}>
                ✉️{" "}
                <a
                  href="mailto:%%Email%%"
                  style={{
                    color: "#0a6e3f",
                    textDecoration: "none",
                  }}
                >
                  %%Email%%
                </a>
              </p>

              <p style={{ margin: 0, fontSize: "12px", color: "#555" }}>
                🌐{" "}
                <a
                  href="https://www.ecotranschile.cl"
                  style={{
                    color: "#0a6e3f",
                    textDecoration: "none",
                  }}
                >
                  www.ecotranschile.cl
                </a>
              </p>
            </td>
          </tr>

          <tr>
            <td colSpan={2}>
              <br />
            </td>
          </tr>

          {/* Fila QR y mensaje */}
          <tr>
            <td
              colSpan={2}
              style={{
                paddingTop: "15px",
                backgroundColor: "#f2f7f2",
                border: "1px solid #d0e5d8",
                borderRadius: "6px",
                padding: "8px",
              }}
            >
              <img
                src="https://www.ecotranschile.cl/img/qr_apps.jpg"
                alt="QR Ecotrans"
                width={90}
                height={90}
                style={{
                  display: "inline-block",
                  verticalAlign: "middle",
                  marginRight: "10px",
                }}
              />

              <div
                style={{
                  display: "inline-block",
                  verticalAlign: "middle",
                  maxWidth: "440px",
                  lineHeight: "1.3",
                  fontSize: "12px",
                  color: "#555",
                }}
              >
                <h2
                  style={{
                    fontStyle: "italic",
                    fontWeight: "bold",
                    margin: 0,
                    color: "#6C9E3C",
                    fontSize: "14px",
                  }}
                >
                  Nuevos canales de atención
                </h2>
                Queremos estar más cerca de ti, habilitando nuevos canales de
                atención.
                <br />
                Visítanos en{" "}
                <a
                  href="https://apps.ecotranschile.cl/"
                  style={{
                    color: "#0a6e3f",
                    textDecoration: "none",
                  }}
                >
                  apps.ecotranschile.cl
                </a>
                <br />O escanea el código QR para acceder directamente.
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
}
