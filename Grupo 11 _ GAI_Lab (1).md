# Laboratorio 12: Evaluación de Respuestas Generadas por un LLM

## Materia y Grupo

Inteligencia Artificial G4 - Grupo 11
## Integrantes
1. Crisóstomo Altamirano, Axl Mikel
2. Chunga Chevez, Axel Josué
3. Cruz Hilaquita, Rodrigo
4. Vasquez Pelaez, Francess Jeicoll

## Objetivo

Comparar las respuestas elaboradas por los estudiantes durante la práctica de aula con las respuestas generadas por un modelo de lenguaje grande (LLM), identificando similitudes, diferencias, fortalezas y limitaciones.

---

## Instrucciones

1. Utilice un LLM de su preferencia (ChatGPT, Gemini, Claude, Copilot, Perplexity u otro).
2. Registre el nombre del LLM utilizado.
3. Ingrese cada una de las preguntas planteadas durante la práctica de aula.
4. Compare las respuestas generadas por el LLM con las respuestas elaboradas previamente por su grupo.
5. Analice críticamente los resultados obtenidos.
6. Entregue un único archivo en formato `.md`.

---

## Datos Generales

**Grupo:** 11

**Integrantes:** 

- Axl Mikel Crisostomo Altamirano 
- Axel Josue Chunga Chevez
- Francess Jeicoll Vasquez Pelaez
- Rodrigo Cruz Hilaquita

**LLM utilizado:** Gemini

---

# Parte 1. Consulta al LLM

Ingrese las siguientes preguntas al LLM seleccionado.

### Pregunta 1

¿Qué limitaciones de los RNN y los LSTM motivaron el desarrollo del Transformer?

**Respuesta del LLM:**

El desarrollo de la arquitectura **Transformer** (introducida en 2017 con el famoso artículo *"Attention Is All You Need"*) fue una respuesta directa a varias limitaciones críticas que tenían las redes neuronales recurrentes (**RNN**) y sus variantes avanzadas, como las **LSTM** (Long Short-Term Memory) y las **GRU**.

Aunque las LSTM fueron una revolución para procesar secuencias, se chocaron contra un muro técnico debido a tres problemas principales:

---

## 1. El cuello de botella de la secuencialidad (Falta de paralelización)

Las RNN y LSTM procesan la información **palabra por palabra, en orden**. Para procesar la quinta palabra de una frase, la red necesita obligatoriamente haber procesado la cuarta, la tercera, la segunda y la primera, manteniendo un "estado oculto" ($h_t$) que se actualiza a cada paso.

* **La limitación:** Esto hace que sea **imposible paralelizar el entrenamiento** en las tarjetas gráficas (GPUs) modernas. Las GPUs son excelentes haciendo miles de cálculos a la vez, pero con las LSTM tenían que quedarse esperando a que terminara el cálculo del paso anterior.
* **La solución del Transformer:** Elimina la recurrencia por completo. Procesa **toda la secuencia al mismo tiempo** (en paralelo) utilizando mecanismos de atención, lo que permite entrenar modelos gigantescos en una fracción del tiempo.

---

## 2. El problema de la memoria a largo plazo (Long-Range Dependencies)

Teóricamente, las LSTM se diseñaron con "puertas" para recordar información lejana. Sin embargo, en la práctica, seguían sufriendo cuando los textos eran muy largos (cientos o miles de palabras).

* **La limitación:** La información tiene que viajar a través de una larga cadena de pasos. A medida que avanza, la señal de las primeras palabras se va "diluyendo" o distorsionando (un problema muy ligado al **desvanecimiento del gradiente** durante el entrenamiento). Si la palabra 1 es un sujeto y el verbo está en la palabra 100, a la LSTM le cuesta horrores conectar ambas.
* **La solución del Transformer:** Gracias al mecanismo de **Self-Attention (Autoatención)**, la distancia matemática entre cualquier par de palabras en una secuencia es de exactamente **un paso**. No importa si una palabra está al inicio del libro y otra al final; el Transformer puede conectarlas directamente.

---

## 3. La pérdida de contexto bidireccional real

Para entender el significado de una palabra, a menudo necesitas saber qué viene *después* de ella, no solo qué vino antes.

* **La limitación:** Las RNN tradicionales leen de izquierda a derecha. Aunque existen las RNN bidireccionales (BiLSTM), estas operan entrenando dos redes separadas (una hacia adelante y otra hacia atrás) y luego concatenando sus resultados. No es un contexto unificado y profundamente bidireccional.
* **La solución del Transformer:** Al mirar toda la frase a la vez, el mecanismo de atención permite que cada palabra examine e integre el contexto de **todas las demás palabras simultáneamente** (tanto a su izquierda como a su derecha) en cada capa del modelo.

---

## Resumen de diferencias clave

| Característica | RNN / LSTM | Transformer |
| --- | --- | --- |
| **Procesamiento** | Secuencial (paso a paso) | En paralelo (toda la secuencia a la vez) |
| **Escalabilidad con GPUs** | Mala (baja eficiencia) | Excelente (aprovecha al máximo el hardware) |
| **Distancia de memoria** | Limitada (sufre con textos largos) | Teóricamente ilimitada dentro de su ventana de contexto |
| **Contexto** | Principalmente unidireccional (o bidireccional artificial) | Bidireccional puro y nativo |

En resumen, las LSTM eran como leer un libro línea por línea sin poder saltarte páginas; el Transformer es como tener una vista de pájaro de toda la página, permitiendo que tus ojos conecten instantáneamente cualquier palabra con otra que tenga relación, sin importar dónde estén.

### Pregunta 2

¿Cuál es la función del mecanismo de atención en Transformer?

**Respuesta del LLM:**

El mecanismo de atención, y más específicamente la **Autoatención (Self-Attention)**, es literalmente el motor del Transformer. Su función principal es **permitir que el modelo evalúe la relación y la importancia de cada palabra de una secuencia con respecto a todas las demás**, sin importar la distancia que haya entre ellas.

En lugar de procesar el texto palabra por palabra, el mecanismo de atención le da a cada palabra una "vista de pájaro" de toda la frase para que pueda absorber el contexto que necesita.

Aquí te explico detalladamente cómo funciona y qué tareas cumple:

---

## 1. Capturar el contexto dinámico (Resolución de ambigüedad)

En el lenguaje humano, el significado de una palabra cambia drásticamente según las palabras que la rodean.

Por ejemplo, piensa en la palabra **"banco"** en estas dos frases:

1. *"Fui al **banco** a retirar dinero."*
2. *"Me senté en el **banco** del parque."*

* **¿Qué hace la atención?** Cuando el Transformer procesa la palabra *"banco"* en la primera frase, el mecanismo de atención detecta que tiene una relación muy fuerte con *"dinero"* y *"retirar"*. Gracias a esto, el modelo ajusta la representación matemática de *"banco"* para que signifique "entidad financiera". En la segunda frase, la atención conecta *"banco"* con *"parque"* y *"senté"*, cambiando su significado a "mueble".

---

## 2. ¿Cómo funciona matemáticamente? (Queries, Keys y Values)

Para lograr esto, el mecanismo de atención funciona de manera similar a un **motor de búsqueda de bases de datos**. A cada palabra de la frase se le asignan tres vectores mediante matrices de pesos entrenables:

* **Query ($Q$):** ¿Qué estoy buscando? (Es la palabra actual intentando entender su entorno).
* **Key ($K$):** ¿Qué ofrezco? (Es el "perfil" o etiqueta de cada palabra en la frase para ver si coincide con la búsqueda).
* **Value ($V$):** ¿Qué información tengo? (El contenido real de la palabra que se heredará si hay una coincidencia).

El cálculo se realiza mediante la fórmula de la **Atención de Producto Escalar Escalado (Scaled Dot-Product Attention)**:

$$\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V$$

1. **Multiplicación $QK^T$:** El modelo multiplica la *Query* de una palabra por las *Keys* de todas las demás palabras de la frase. Esto genera una puntuación (score) de afinidad.
2. **Escalado ($\sqrt{d_k}$) y Softmax:** Las puntuaciones se normalizan para transformarse en probabilidades o porcentajes (entre 0 y 1). Esto crea un **mapa de atención**: cuánta importancia debe darle la palabra X a la palabra Y.
3. **Multiplicación por $V$:** Finalmente, estos porcentajes se multiplican por los *Values*. Las palabras con mayor puntuación de atención aportarán la mayor parte de su información a la representación final de la palabra actual.

---

## 3. Mecanismo de Atención Múltiple (Multi-Head Attention)

El Transformer no hace este proceso una sola vez; lo hace varias veces en paralelo. Esto se conoce como **Atención Cabezal Múltiple**.

Si el modelo usara un solo "cabezal" de atención, podría enfocarse únicamente en una sola relación (por ejemplo, relacionar un pronombre con su sujeto). Al usar múltiples cabezales (por ejemplo, 8 o 16 en paralelo):

* Un cabezal puede enfocarse en las **relaciones gramaticales** (sujeto-verbo).
* Otro cabezal puede enfocarse en el **contexto de los lugares o tiempos**.
* Otro puede rastrear las **referencias de pronombres** (*"Ella"* se refiere a *"María"*).

---

## Resumen de sus funciones clave

* **Conexión instantánea:** Elimina la necesidad de pasar por estados intermedios. Une cualquier palabra con otra en un solo paso matemático, resolviendo el problema de las dependencias a largo plazo.
* **Paralelización:** Como el cálculo de la fórmula se puede hacer para todas las palabras al mismo tiempo mediante operaciones de matrices, permite que el modelo se entrene masivamente rápido en GPUs.
* **Representaciones ricas:** Logra que los embeddings (los vectores de las palabras) dejen de ser estáticos y pasen a ser contextuarios y ultra-precisos.

### Pregunta 3

¿Por qué GPT puede considerarse un modelo autoregresivo basado en Transformer?

**Respuesta del LLM:**

Para entender por qué GPT (**Generative Pre-trained Transformer**) es un modelo **autorregresivo basado en Transformer**, tenemos que desglosar el término en dos partes: su herencia genética (el **Transformer**) y su comportamiento o forma de trabajar (lo **autorregresivo**).

Aquí te explico exactamente qué significa esta combinación:

---

## 1. Basado en Transformer: El "Motor"

Decir que GPT está basado en Transformer significa que utiliza la arquitectura que revolucionó el procesamiento de lenguaje en 2017. Sin embargo, el Transformer original tiene dos partes: un **Encoder** (que lee y comprende el texto) y un **Decoder** (que genera texto nuevo).

* **El secreto de GPT:** GPT utiliza **únicamente el bloque Decoder** del Transformer original (repetido decenas o cientos de veces en capas).
* **Atención Enmascarada (Masked Self-Attention):** A diferencia del Transformer estándar donde una palabra puede mirar hacia adelante y hacia atrás, el Decoder de GPT usa una versión "enmascarada". Esto significa que cuando el modelo está procesando una palabra, tiene prohibido mirar las palabras que vienen después. Solo puede mirar hacia el pasado (las palabras que ya se han escrito).

---

## 2. Autorregresivo: El "Mecanismo de Generación"

En estadística y aprendizaje automático, un proceso es **autorregresivo** cuando predice el futuro basándose completamente en sus propios resultados pasados.

GPT funciona exactamente así: **genera texto palabra por palabra (o token por token), y cada palabra que genera se convierte en parte de la entrada para el siguiente paso.**

### El ciclo paso a paso:

Imagina que le pides a GPT que complete la frase: *"El sol sale por el..."*

* **Paso 1:** Entrada: `["El", "sol", "sale", "por", "el"]` $\rightarrow$ GPT predice la palabra más probable: **"este"**.
* **Paso 2:** Entrada: `["El", "sol", "sale", "por", "el", "este"]` $\rightarrow$ GPT añade su propia predicción anterior a la entrada y ahora predice: **"y"**.
* **Paso 3:** Entrada: `["El", "sol", "sale", "por", "el", "este", "y"]` $\rightarrow$ Ahora predice: **"se"**.

Este bucle se repite hasta que el modelo genera un token especial de parada (EOF o End of Text) o alcanza el límite de longitud configurado.

---

## ¿Por qué esta combinación es tan potente?

Al unir la arquitectura Transformer con el enfoque autorregresivo, GPT consigue lo mejor de ambos mundos:

* **Contexto masivo gracias al Transformer:** Mientras genera la siguiente palabra de forma autorregresiva, el mecanismo de atención le permite recordar con total precisión lo que escribió 5,000 palabras atrás. Sabe mantener el hilo del discurso, el tono y las reglas gramaticales.
* **Creatividad y fluidez:** Al calcular probabilidades para cada palabra subsiguiente en base a todo el bloque anterior, puede generar texto extremadamente natural, adaptándose dinámicamente a lo que él mismo va escribiendo.

En resumen, GPT es **basado en Transformer** porque esa es la estructura de redes neuronales y atención que lleva por dentro, y es **autorregresivo** porque su método para crear texto consiste en usar sus propias palabras pasadas como pistas para adivinar la palabra que viene inmediatamente después.

# Parte 2. Comparación de respuestas

## Pregunta 1

### Respuesta elaborada por el grupo

Las limitaciones fueron: La naturaleza inherente secuencial que impide la paralelización dentro de los ejemplos del entrenamiento, ya que las limitaciones de memoria restringen el procesamiento en lotes.

---

### Respuesta generada por el LLM

Las LSTM eran como leer un libro línea por línea sin poder saltarte páginas; el Transformer es como tener una vista de pájaro de toda la página, permitiendo que tus ojos conecten instantáneamente cualquier palabra con otra que tenga relación, sin importar dónde estén.

---

### Comparación

* **Similitudes:** Ambas respuestas coinciden en que la limitación principal de las RNN/LSTM es su naturaleza secuencial porque impide procesar elementos en paralelo.
* **Diferencias:** El grupo responde de forma técnica y precisa gracias al artículo mientras que ell LLM responde con una analogía visual sin términos técnicos.
* **Aspectos adicionales aportados por el LLM:** Adiciona una comparación directa entre LSTM y Transformer, mostrando cómo el Transformer resuelve el problema mediante conexión instantánea entre palabras distantes.
* **Aspectos omitidos por el LLM:** No menciona las limitaciones de memoria ni el procesamiento en lotes (batch processing), que son conceptos clave señalados por el grupo.

---

## Pregunta 2

### Respuesta elaborada por el grupo

El mecanismo de atención tiende a ser el componente central del Transformer, ya que cumple la función de ponderar la importancia de cada token mostrando la relevancia de cada palabra que entra al modelo logrando una mejor relación entre ellos sin importar la distancia que los separa.

---

### Respuesta generada por el LLM

El mecanismo de atención, y más específicamente la Autoatención (Self-Attention), es literalmente el motor del Transformer. Su función principal es permitir que el modelo evalúe la relación y la importancia de cada palabra de una secuencia con respecto a todas las demás, sin importar la distancia que haya entre ellas.

---

### Comparación

* **Similitudes:** Ambas respuestas coinciden en que el mecanismo de atención es el componente central del Transformer y que su función es ponderar la importancia de cada token independientemente de la distancia entre ellos.
* **Diferencias:** El grupo explica más la importancia de cada palabra que entra al modelo, mientras que el LLM especifica que la evaluación es de cada palabra con respecto a las demás simultáneamente.
* **Aspectos adicionales aportados por el LLM:** Introduce el término técnico específico de Autoatención, precisando que es una variante particular del mecanismo de atención.
* **Aspectos omitidos por el LLM:** No menciona explícitamente el concepto de "ponderación", que el grupo sí señala como parte del funcionamiento del mecanismo.

---

## Pregunta 3

### Respuesta elaborada por el grupo

Debido a la estructura de GPT es autoregresivo, ya que genera token por token mirando solo hacia atrás para evitar perder el contexto y está enfocado en un Transformer porque simula una estructura basada en esta pero especializada en la atención enmascarada en lugar de recurrencia para lograrlo.

---

### Respuesta generada por el LLM

GPT es basado en Transformer porque esa es la estructura de redes neuronales y atención que lleva por dentro, y es autorregresivo porque su método para crear texto consiste en usar sus propias palabras pasadas como pistas para adivinar la palabra que viene inmediatamente después.

---

### Comparación

* **Similitudes:** Ambas respuestas coinciden en que GPT es autoregresivo porque genera token por token mirando hacia el pasado y que su base arquitectónica es el Transformer.
* **Diferencias:** El grupo menciona la atención enmascarada como el mecanismo específico que distingue a GPT dentro del Transformer. El LLM simplifica el proceso como usar palabras pasadas como pista sin profundizar en el mecanismo interno.
* **Aspectos adicionales aportados por el LLM:** Explica de forma más intuitiva y accesible la idea de autorregresión como un proceso de adivinanza basado en el contexto previo.
* **Aspectos omitidos por el LLM:** No menciona la masked attention, que es el elemento técnico más relevante y diferenciador que el grupo sí identificó correctamente.


---

# Parte 3. Refinamiento del Prompt

Seleccione una de las tres preguntas anteriores y modifique el prompt para obtener una respuesta más detallada. Para ello puede incluir alguno de los siguientes aspectos: solicite ejemplos, especificar un público objetivo, indique el nivel de detalle deseado, solicite comparaciones con otros modelos, darle un formato de respuesta específico entre otros.

### Prompt original

¿Por qué GPT puede considerarse un modelo autoregresivo basado en Transformer?

---

### Prompt refinado

Necesito que me expliques si los modelos LLM como GPT son considerados autoregresivos en base a un transformer como un System Engineer, necesito detalles para relacionar los conocimientos y sea de fácil entendimiento que sea 2 párrafos a lo mucho, además realiza comparativas entre diferentes modelos LLM. 

---

### Respuesta obtenida

Como System Engineer, piensa en la arquitectura Transformer como la topología del hardware subyacente (un motor que procesa datos en paralelo usando Self-Attention) y en el enfoque autorregresivo como tu bucle de ejecución principal (un while-loop o máquina de estados iterativa). Modelos como GPT son considerados "autorregresivos basados en Transformer" porque en tiempo de inferencia operan como un pipeline secuencial: toman un estado inicial de datos (el prompt), calculan el siguiente elemento más probable y retroalimentan ese output en el sistema como el nuevo input para la siguiente iteración matemática ($x_{t+1} = f(x_{0...t})$). Al estar basados exclusivamente en los bloques Decoder del Transformer, aplican una máscara (Masked Attention) que bloquea estrictamente la lectura de espacios de memoria futuros, obligando al sistema a generar datos basándose únicamente en la "telemetría" histórica, lo que garantiza un flujo de datos estrictamente causal.A nivel de arquitectura de sistemas, las diferencias entre modelos dictan su caso de uso óptimo en producción. La familia GPT o LLaMA (Decoder-only y autorregresivos) está diseñada como un generador de flujo de salida continuo, optimizado para la creación de texto o código. En contraste, modelos como BERT son Encoder-only (autoencoders bidireccionales); no tienen ese bucle while para generar texto palabra por palabra, sino que leen todo el bloque de datos a la vez para extraer el contexto profundo, siendo ideales para clasificación, búsqueda o análisis de logs. Finalmente, arquitecturas modulares como T5 o BART utilizan el paquete completo (Encoder-Decoder): el Encoder comprime la entrada en un vector de estado latente y el Decoder lee ese vector para generar la salida de forma autorregresiva, siendo la arquitectura de red preferida para tareas de "transcodificación", como la traducción o la sumarización de información compleja.

---

### Análisis

¿Cómo cambió la respuesta al modificar el prompt?

Hubo muchos cambios debido a que la respuesta se dio con mucho más detalle, dentro de ello se generó comparativas para relacionar conocimiento previo con los nuevos tópicos de aprendizaje, añadió fórmulas y complementos que nutrieron la comparación entre modelos.

---

# Parte 4. Reflexión Final

Responda las siguientes preguntas:

1. ¿Qué tan similares fueron las respuestas del LLM respecto a las respuestas elaboradas por el grupo?

Fueron diferentes, debido a que una tenía el contexto del paper mientras que la otra se basó netamente en las especificaciones del prompt y la información que encontró en internet para un determinado público que se le especificó. 

2. ¿Qué información nueva aportó el LLM?
Un enfoque más para un perfil de ingeniería donde se detalla estos puntos:
- Fórmulas
- Comparativas entre modelos
- Visión profesional
- Arquitecturas

3. ¿Qué limitaciones encontró en las respuestas generadas?
Las limitaciones de la respuesta generada del prompt mejorado, al no haber insertado papers, esta respuesta es generada en base a la información que encontró en internet y combinación de múltiples investigaciones. Esto genera una incertidumbre sobre la validez que tiene esta respuesta y la necesidad de validar la información.

4. ¿Cómo influyó el refinamiento del prompt en la calidad de la respuesta?
Al especificarle un público objetivo, nivel de detalle y pedir comparativas entre modelos, la respuesta mejoró bastante. En lugar de una explicación genérica, el LLM respondió con un enfoque más técnico e incluyó fórmulas y arquitecturas concretas, lo que hizo mucho más fácil conectar la respuesta con lo que ya sabíamos.

5. ¿Considera que un LLM puede reemplazar completamente el razonamiento humano en tareas académicas? Justifique.
Depende del tipo de tarea. En preguntas cerradas o con respuesta única sí puede funcionar bien, pero en tareas que requieren abstracción, criterio propio o análisis profundo, no lo reemplaza. Por más avanzado que sea el modelo, siempre puede cometer alucinaciones y presentar información incorrecta como si fuera válida, por eso es importante usarlo como herramienta de apoyo y no como fuente definitiva.

---

# Conclusiones

Redacte al menos tres conclusiones obtenidas durante el desarrollo del laboratorio.

1. El LLM dio respuestas más largas y fáciles de entender, pero le faltó precisión técnica comparado con lo que respondimos directamente del paper. Cada uno tiene su utilidad dependiendo del contexto.
2. Mejorar el prompt hace una diferencia enorme. Con solo especificar el perfil, el formato y el nivel de detalle, la respuesta cambió completamente y fue mucho más útil y aplicable.
3. El LLM no es 100% confiable para tareas académicas porque no siempre se basa en fuentes verificadas. Hay que saber usarlo como apoyo, no como respuesta final.