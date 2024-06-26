import { useState, useEffect, useRef } from "react";
import axios, { all } from "axios";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import "../App.css";

import UserIcon from "../icons/UserIcon.jsx";
import PlusIcon from "../icons/PlusIcon.jsx";
import { FaCamera } from "react-icons/fa";
import DeleteIcon from "../icons/DeleteIcon.jsx";

const ProductForm = () => {
  const maxClientes = 5;

  // ESTADOS
  const [clientes, setClientes] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [requisitos, setRequisitos] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState("");
  const [selectedClienteNombre, setSelectedClienteNombre] = useState("");
  const [selectedModelo, setSelectedModelo] = useState("");
  const [selectedModeloNombre, setSelectedModeloNombre] = useState("");
  const [form, setForm] = useState({
    numeroCuadro: "",
    numeroInterruptor: "",
    numeroCliente1: "",
    numeroCliente2: "",
    numeroCliente3: "",
    numeroCliente4: "",
    numeroCliente5: "",
  });
  const [requisitosCumplidos, setRequisitosCumplidos] = useState({});
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [userId, setUserId] = useState(null);
  const [fotos, setFotos] = useState([]);
  const [nombresFotos, setNombresFotos] = useState([]);
  const [contadorFotos, setContadorFotos] = useState(0);
  const [clientesAdicionales, setClientesAdicionales] = useState([]);
  const maxFotos = 6;
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);

  const [modeloImagen, setModeloImagen] = useState("");

  const añadirClientes = () => {
    if (clientesAdicionales.length < maxClientes - 1) {
      setClientesAdicionales([
        ...clientesAdicionales,
        { id: clientesAdicionales.length + 2 },
      ]);
    } else {
      alert("ERROR: No se pueden agregar más clientes");
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decodedToken = JSON.parse(atob(token.split(".")[1]));
      setUserId(decodedToken.id);
    }
  }, []);

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const response = await axios.get("http://localhost:3001/clientes");
        setClientes(response.data);
      } catch (error) {
        console.error("Error fetching clients:", error);
      }
    };

    fetchClientes();
  }, []);

  const fetchModelosCliente = async (clienteId) => {
    try {
      const result = await axios.get(`http://localhost:3001/modelos`, {
        params: {
          clienteId: clienteId,
        },
      });
      setModelos(result.data);
    } catch (error) {
      console.error("Error fetching models for client:", error);
    }
  };

  useEffect(() => {
    if (selectedCliente) {
      fetchModelosCliente(selectedCliente);
    } else {
      setModelos([]);
    }
  }, [selectedCliente]);

  const fetchRequisitos = async (modeloId) => {
    try {
      const result = await axios.get(
        `http://localhost:3001/requisitos/modelo/${modeloId}`
      );
      setRequisitos(result.data);
      const initialRequisitos = {};
      result.data.forEach((requisito) => {
        initialRequisitos[requisito.id] = false;
      });
      setRequisitosCumplidos(initialRequisitos);
    } catch (error) {
      console.error("Error fetching requirements:", error);
    }
  };

  const handleClienteChange = (e) => {
    const clienteId = e.target.value;
    const clienteNombre = e.target.options[e.target.selectedIndex].text;
    setSelectedCliente(clienteId);
    setSelectedClienteNombre(clienteNombre);
    setSelectedModelo("");
    setSelectedModeloNombre("");
  };

  const handleModeloChange = (e) => {
    const modeloId = e.target.value;
    const modeloNombre = e.target.options[e.target.selectedIndex].text;
    setSelectedModelo(modeloId);
    setSelectedModeloNombre(modeloNombre);
    fetchRequisitos(modeloId);
    const modeloSeleccionado = modelos.find(
      (modelo) => modelo.id === parseInt(modeloId)
    );
    if (modeloSeleccionado) {
      setModeloImagen(modeloSeleccionado.imagen);
    } else {
      setModeloImagen("");
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith("requisito_")) {
      const requisitoId = name.split("_")[1];
      setRequisitosCumplidos((prevState) => ({
        ...prevState,
        [requisitoId]: checked,
      }));
    } else {
      setForm((prevForm) => ({
        ...prevForm,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  useEffect(() => {
    const allChecked = Object.values(requisitosCumplidos).every(
      (value) => value
    )    
    setIsButtonDisabled(!allChecked);
    
  }, [requisitosCumplidos]);

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!selectedCliente || !selectedModelo) {
      alert("Por favor, selecciona un cliente y un modelo.");
      return;
    }

    // Almacenar todos los requisitos checkeados
    const allChecked = Object.values(requisitosCumplidos).every(
      (value) => value
    )
  
    if(!allChecked) {
      alert("ERROR: Todos los requisitos deben de estar cumplidos.");
      return;  // Asegurarse de no continuar si los requisitos no están cumplidos
    }
  
    try {
      const data = {
        ...form,
        id_usuario: userId,
        id_cliente: selectedCliente,
        id_modelo: selectedModelo,
        numero_cuadro: form.numeroCuadro,
        numero_interruptor: form.numeroInterruptor,
        numero_cliente: form.numeroCliente1,
        numero_cliente2: form.numeroCliente2,
        numero_cliente3: form.numeroCliente3,
        numero_cliente4: form.numeroCliente4,
        numero_cliente5: form.numeroCliente5,
        requisitos_cumplidos: requisitosCumplidos,
        imagenes: nombresFotos,
      };
  
      console.log("Datos enviados:", data);
  
      const response = await axios.post("http://localhost:3001/verificaciones", data);
  
      if (response.status === 200) {
        alert("Verificación guardada con éxito");
  
        // Mapear IDs de requisitos cumplidos a sus nombres
        const nombresRequisitosCumplidos = Object.keys(requisitosCumplidos)
          .filter((key) => requisitosCumplidos[key])
          .map((key) => {
            const requisito = requisitos.find((req) => req.id === parseInt(key));
            return requisito ? requisito.nombre_requisito : key;
          });
  
        // Generar PDF
        const doc = new jsPDF();
  
        // Cargar imagen desde el archivo
        const logoUrl = "/src/assets/logo-istel.png";
        const logoImage = new Image();
        logoImage.src = logoUrl;
  
        // Configurar estilos
        const titleFontSize = 24;
        const textFontSize = 12;
        const margin = 20;
        const marginTop = 20;
        const lineSpacing = 10;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const logoWidth = 50;
        const logoHeight = 40;
  
        // Añadir logo
        doc.addImage(
          logoImage,
          "PNG",
          (pageWidth - logoWidth) / 2,
          marginTop,
          logoWidth,
          logoHeight
        );
  
        // Título
        doc.setFont("helvetica", "bold");
        doc.setFontSize(titleFontSize);
        doc.setTextColor(40, 40, 40);
        doc.text(
          "Verificación de Producto",
          pageWidth / 2,
          marginTop + logoHeight + 20,
          { align: "center" }
        );
  
        // Información general y requisitos cumplidos en tabla
        doc.setFont("helvetica", "normal");
        doc.setFontSize(textFontSize);
        doc.setTextColor(60, 60, 60);
        let currentY = marginTop + logoHeight + 40;
  
        const tableData = [
          ["N° Cuadro", form.numeroCuadro],
          ["Cliente", selectedClienteNombre],
          ["Modelo", selectedModeloNombre],
          ["N° Serie interruptor general", form.numeroInterruptor],
          ["Operario", userId],
          ["N° Cliente 1", form.numeroCliente1],
          ["N° Cliente 2", form.numeroCliente2],
          ["N° Cliente 3", form.numeroCliente3],
        ];
  
        const additionalTableData = [
          ["N° Cliente 4", form.numeroCliente4],
          ["N° Cliente 5", form.numeroCliente5],
          [
            "Requisitos cumplidos",
            nombresRequisitosCumplidos.length > 0
              ? nombresRequisitosCumplidos.join(", ")
              : "No se cumplieron requisitos",
          ],
        ];
  
        const addTableToDoc = (
          doc,
          startX,
          startY,
          tableData,
          textFontSize,
          cellPadding,
          margin
        ) => {
          const cellWidth = (pageWidth - 2 * margin) / 2;
  
          tableData.forEach((row, rowIndex) => {
            const rowY = startY + rowIndex * (textFontSize + 2 * cellPadding);
            // Verificar si se necesita una nueva página
            if (rowY + textFontSize + 2 * cellPadding > pageHeight - margin) {
              doc.addPage();
              startY = margin;
              // rowY = startY;
            }
            row.forEach((cell, colIndex) => {
              const cellX = startX + colIndex * cellWidth;
              doc.rect(cellX, rowY, cellWidth, textFontSize + 2 * cellPadding);
              const splitText = doc.splitTextToSize(
                (cell || "").toString(),
                cellWidth - 2 * cellPadding
              );
              doc.text(
                splitText,
                cellX + cellPadding,
                rowY + textFontSize + cellPadding / 2
              );
            });
          });
  
          return startY + tableData.length * (textFontSize + 2 * cellPadding);
        };
  
        const cellPadding = 5;
        currentY = addTableToDoc(
          doc,
          margin,
          currentY,
          tableData,
          textFontSize,
          cellPadding,
          margin
        );
  
        // Verificar si se necesita una nueva página para los campos adicionales
        if (
          currentY +
            lineSpacing +
            additionalTableData.length * (textFontSize + 2 * cellPadding) >
          pageHeight
        ) {
          doc.addPage();
          currentY = margin;
        } else {
          currentY += lineSpacing + 10;
        }
  
        currentY = addTableToDoc(
          doc,
          margin,
          currentY,
          additionalTableData,
          textFontSize,
          cellPadding,
          margin
        );
  
        // Verificar si se necesita una nueva página para las fotos
        if (currentY + lineSpacing + 30 > pageHeight) {
          doc.addPage();
          currentY = margin;
        } else {
          currentY += lineSpacing + 10;
        }
  
        // Añadir fotos al PDF
        const fotoWidth = 35;
        const fotoHeight = 35;
        let x = margin;
        let y = currentY;
        fotos.forEach((foto, index) => {
          if (index % 3 === 0 && index !== 0) {
            y += fotoHeight + 10;
            x = margin;
            if (y + fotoHeight > pageHeight) {
              doc.addPage();
              y = margin;
            }
          }
          doc.addImage(foto, "JPEG", x, y, fotoWidth, fotoHeight);
          x += fotoWidth + 10;
        });
  
        doc.save("verificacion_producto.pdf");
  
        // Generar Excel
        const excelData = {
          "N° Cuadro": form.numeroCuadro,
          Cliente: selectedClienteNombre,
          Modelo: selectedModeloNombre,
          "N° Serie interruptor general": form.numeroInterruptor,
          Operario: userId,
          "N° Cliente 1": form.numeroCliente1,
          "N° Cliente 2": form.numeroCliente2,
          "N° Cliente 3": form.numeroCliente3,
          "N° Cliente 4": form.numeroCliente4,
          "N° Cliente 5": form.numeroCliente5,
          "Requisitos cumplidos": nombresRequisitosCumplidos.join(", "),
          Imágenes: nombresFotos.join(", "),
        };
  
        const worksheet = XLSX.utils.json_to_sheet([excelData]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Verificaciones");
        XLSX.writeFile(workbook, "verificacion_producto.xlsx");
      }
    } catch (error) {
      console.error("Error al guardar la verificación:", error);
      alert("Error al guardar la verificación");
    }
  }
  
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error al acceder a la camara:", error);
    }
  };

  const takePhoto = async () => {
    if (contadorFotos >= maxFotos) {
      alert("No se pueden tomar más fotos");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext("2d");
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    const newPhoto = canvas.toDataURL("image/png");

    // Subir la imagen al servidor
    try {
      const formData = new FormData();
      formData.append("image", dataURLtoBlob(newPhoto));
      const response = await axios.post(
        "http://localhost:3001/upload-image",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 200) {
        const nombre_foto = response.data.fileName;
        setFotos((prevPhotos) => [...prevPhotos, newPhoto]);
        setNombresFotos((prevNames) => [...prevNames, nombre_foto]);
        setContadorFotos(contadorFotos + 1);

        if (contadorFotos + 1 >= maxFotos) {
          stopCamera();
          alert("No se pueden tomar más fotos");
        }
      } else {
        console.error("Error al subir la imagen:", response.statusText);
      }
    } catch (error) {
      console.error("Error al subir la imagen:", error);
    }
  };

  const dataURLtoBlob = (dataURL) => {
    const arr = dataURL.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const handleCameraClick = () => {
    if (!stream) {
      openCamera();
    } else {
      takePhoto();
    }

    if (fotos.length < maxFotos) {
      if (fotos.length + 1 === maxFotos) {
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleDelete = (id) => {
    setForm((prevForm) => {
      const newForm = { ...prevForm };
      delete newForm[`numeroCliente${id}`];

      // Recalcular los IDs de los clientes restantes
      const updatedForm = {};
      let newId = 1;
      for (const key in newForm) {
        if (key.startsWith("numeroCliente")) {
          updatedForm[`numeroCliente${newId}`] = newForm[key];
          newId++;
        } else {
          updatedForm[key] = newForm[key];
        }
      }

      return updatedForm;
    });

    setClientesAdicionales((prevClientes) => {
      const updatedClientes = prevClientes.filter(
        (cliente) => cliente.id !== id
      );

      // Recalcular los IDs de los clientes restantes
      return updatedClientes.map((cliente, index) => ({ id: index + 2 }));
    });
  };

  return (
    <>
      <header>
        <h1>VERIFICACIÓN DE PRODUCTO</h1>
        <img src="src/assets/logo-istel.png" alt="logo Istel" />
      </header>
      <main className="app-main">
        <section className="formulario">
          <div className="first-section">
            <form onSubmit={handleSubmit}>
              <label htmlFor="numCuadro">N° Cuadro:</label>
              <input
                type="text"
                name="numeroCuadro"
                size={45}
                value={form.numeroCuadro}
                onChange={handleInputChange}
              />
              <br />
              <label htmlFor="cliente">Cliente:</label>
              <select
                name="clientes"
                value={selectedCliente}
                onChange={handleClienteChange}
              >
                <option value="">Selecciona un cliente</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre_cliente}
                  </option>
                ))}
              </select>
              <br />
              <label htmlFor="modelo">Modelo:</label>
              <select
                name="modelos"
                value={selectedModelo}
                onChange={handleModeloChange}
              >
                <option value="">Selecciona un modelo</option>
                {modelos.map((modelo) => (
                  <option key={modelo.id} value={modelo.id}>
                    {modelo.nombre_modelo}
                  </option>
                ))}
              </select>
              <br />
              <br />
              <div className="num-series">
                <label htmlFor="numSerieIntGeneral">
                  Nº Serie Interruptor General:
                </label>
                <input
                  type="text"
                  name="numeroInterruptor"
                  size={15}
                  value={form.numeroInterruptor}
                  onChange={handleInputChange}
                />
                <br />
                <br />
                <label htmlFor="numSerieCliente1">Nº Serie Cliente 1:</label>
                <input
                  type="text"
                  name="numeroCliente1"
                  size={15}
                  value={form.numeroCliente1}
                  onChange={handleInputChange}
                />
                {clientesAdicionales.map((cliente) => (
                  <div key={cliente.id} className="numSeries-clientes">
                    <label htmlFor={`numSerieCliente${cliente.id}`}>
                      Nº Serie Cliente {cliente.id}:
                    </label>
                    <input
                      type="text"
                      id={`numSerieCliente${cliente.id}`}
                      name={`numeroCliente${cliente.id}`}
                      size={15}
                      value={form[`numeroCliente${cliente.id}`] || ""}
                      onChange={handleInputChange}
                    />
                    <button
                      type="button"
                      onClick={() => handleDelete(cliente.id)}
                    >
                      <DeleteIcon />
                    </button>
                    <br />
                  </div>
                ))}
              </div>
              <br />
              <button
                type="submit"
                id="btn-generar"
                disabled={isButtonDisabled}
              >
                Generar PDF/Añadir Excel
              </button>
            </form>
            <div className="operario-foto-producto">
              <div className="operario">
                <span>Operario</span>
                <div className="icono-operario">
                  <UserIcon />
                </div>
              </div>
              <div className="foto-producto">
                {modeloImagen && (
                  <img
                    src={`http://localhost:3001/uploads/${modeloImagen}`}
                    alt="Modelo seleccionado"
                  />
                )}
              </div>
            </div>
          </div>
          <div className="cliente-adicional">
            <button onClick={añadirClientes}>
              <PlusIcon />
            </button>
            <span>Añadir cliente adicional</span>
          </div>
        </section>
        <section className="revisiones">
          {requisitos.map((requisito) => (
            <div key={requisito.id} className="checkbox-wrapper">
              <label className="name-input">{requisito.nombre_requisito}</label>
              <input
                type="checkbox"
                className="styled-checkbox"
                id={`checkbox_${requisito.id}`}
                name={`requisito_${requisito.id}`}
                checked={requisitosCumplidos[requisito.id] || false}
                onChange={(e) => handleInputChange(e)}
              />
              <label
                htmlFor={`checkbox_${requisito.id}`}
                className="checkbox-label"
              ></label>
            </div>
          ))}
        </section>
      </main>
      <footer>
        <div className="fotos">
          <div className="fotos-tomadas">
            {Array.isArray(fotos) &&
              fotos.map((foto, index) => (
                <img
                  key={index}
                  src={foto}
                  alt={`Foto ${index + 1}`}
                  style={{
                    marginLeft: "15px",
                    width: "80px",
                    height: "75px",
                    objectFit: "cover",
                  }}
                />
              ))}
          </div>
          <div className="camera-icon-wrapper">
            {fotos.length < maxFotos && (
              <div className="camera">
                <video
                  ref={videoRef}
                  autoPlay
                  style={{
                    display:
                      videoRef.current && videoRef.current.srcObject
                        ? "block"
                        : "none",
                  }}
                ></video>
              </div>
            )}
          </div>
          <FaCamera className="camera-icon" onClick={handleCameraClick} />
        </div>
      </footer>
    </>
  );
};

export default ProductForm;