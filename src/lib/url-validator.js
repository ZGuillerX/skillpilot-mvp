export async function validateUrl(url, expectedContent = "") {
  try {
    new URL(url);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      method: "HEAD", // Use HEAD for faster validation
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SkillPilot/1.0)",
      },
    });

    clearTimeout(timeoutId);

    const isValid = response.ok && response.status < 400;
    console.log(
      `[v0] URL validation for ${url}: ${isValid ? "SUCCESS" : "FAILED"} (${
        response.status
      })`
    );

    return isValid;
  } catch (error) {
    console.log(`[v0] URL validation failed for ${url}:`, error.message);
    return false;
  }
}

async function checkContentRelevance(content, expectedTopic) {
  try {
    const lowerContent = content.toLowerCase();
    const lowerTopic = expectedTopic.toLowerCase();

    // Detectar la tecnología específica del contenido
    const technologies = {
      php: ["php", "<?php", "laravel", "symfony", "composer"],
      python: ["python", "django", "flask", "pip", "import ", "def "],
      javascript: ["javascript", "js", "node.js", "npm", "function(", "=>"],
      java: ["java", "class ", "public static", "import java"],
      csharp: ["c#", "csharp", "using system", "namespace"],
    };

    // Determinar qué tecnología se está pidiendo
    let requestedTech = null;
    for (const [tech, keywords] of Object.entries(technologies)) {
      if (keywords.some((keyword) => lowerTopic.includes(keyword))) {
        requestedTech = tech;
        break;
      }
    }

    if (!requestedTech) {
      console.log(
        `[v0] Could not determine requested technology from: ${expectedTopic}`
      );
      return false;
    }

    // Verificar que el contenido sea específicamente sobre la tecnología solicitada
    const contentTechKeywords = technologies[requestedTech];
    const hasCorrectTech = contentTechKeywords.some((keyword) =>
      lowerContent.includes(keyword)
    );

    // Verificar que NO contenga otras tecnologías (para evitar mezclas)
    const otherTechs = Object.entries(technologies).filter(
      ([tech]) => tech !== requestedTech
    );
    const hasOtherTech = otherTechs.some(([tech, keywords]) =>
      keywords.some((keyword) => lowerContent.includes(keyword))
    );

    // Verificar que no sea contenido irrelevante
    const isErrorPage =
      lowerContent.includes("404") ||
      lowerContent.includes("not found") ||
      lowerContent.includes("error") ||
      lowerContent.length < 500;

    const isRelevant = hasCorrectTech && !hasOtherTech && !isErrorPage;

    console.log(`[v0] Content relevance check for ${requestedTech}:`, {
      hasCorrectTech,
      hasOtherTech,
      isErrorPage,
      isRelevant,
    });

    return isRelevant;
  } catch (error) {
    console.log(`[v0] Content relevance check failed:`, error.message);
    return false;
  }
}

export async function validateAndFixResource(resource) {
  if (!resource || !resource.url) {
    console.log(
      `[v0] ❌ Resource missing URL, skipping: ${resource?.title || "Unknown"}`
    );
    return null; // Return null instead of fallback
  }

  console.log(`[v0] Validating resource: ${resource.title} - ${resource.url}`);

  const isValid = await validateUrl(resource.url);

  if (isValid) {
    console.log(`[v0] ✅ URL is valid: ${resource.url}`);
    return resource;
  }

  console.log(
    `[v0] ❌ URL failed validation, removing resource: ${resource.url}`
  );
  return null; // Return null instead of fallback - force AI to generate better URLs
}

export async function validateAllPlanResources(plan) {
  if (!plan.modules || !Array.isArray(plan.modules)) {
    return plan;
  }

  console.log(`[v0] Validating ${plan.modules.length} resources...`);

  const validatedModules = [];

  for (let i = 0; i < plan.modules.length; i++) {
    const module = plan.modules[i];
    console.log(`[v0] Validating module ${i + 1}: ${module.title}`);

    if (module.resource) {
      const validatedResource = await validateAndFixResource(module.resource);

      if (validatedResource) {
        validatedModules.push({
          ...module,
          resource: validatedResource,
        });
      } else {
        console.log(
          `[v0] ⚠️ Skipping module with invalid resource: ${module.title}`
        );
        // Skip modules with invalid resources instead of using fallbacks
      }
    } else {
      console.log(`[v0] ⚠️ Skipping module without resource: ${module.title}`);
    }
  }

  console.log(
    `[v0] ✅ Validation complete: ${validatedModules.length}/${plan.modules.length} modules kept`
  );

  return {
    ...plan,
    modules: validatedModules,
  };
}
