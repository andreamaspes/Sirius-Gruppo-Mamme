using SiriusBackend;
using SiriusBackend.Dati;
using SiriusBackend.Models;
using Microsoft.EntityFrameworkCore;
using CsvHelper;
using CsvHelper.Configuration;
using System.Globalization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<SiriusContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});

// Registra le DAL nel container DI
builder.Services.AddScoped<TurbinaDAL>();
builder.Services.AddScoped<VentoDAL>();

var app = builder.Build();

app.UseCors();

// Applica migrazioni e importa CSV all'avvio
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<SiriusContext>();
        
    try
    {
        // Assicura che il database sia creato e migrazioni applicate
        context.Database.Migrate();

        // Importa dati di energia
        if (!context.Energia.Any())
        {
            var csvPath = Path.Combine(AppContext.BaseDirectory, "Dati", "Dati.csv");

            // Se il file non esiste nella cartella di output, cerca nella cartella del progetto
            if (!File.Exists(csvPath))
            {
                var projectPath = Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "Dati", "Dati.csv");
                csvPath = Path.GetFullPath(projectPath);
            }

            if (File.Exists(csvPath))
            {
                var config = new CsvConfiguration(CultureInfo.InvariantCulture)
                {
                    Delimiter = ";",
                    HeaderValidated = null,
                    MissingFieldFound = null
                };

                using var reader = new StreamReader(csvPath);
                using var csv = new CsvReader(reader, config);

                var records = csv.GetRecords<EnergiaRecord>().ToList();
                context.Energia.AddRange(records);
                context.SaveChanges();
            }
        }

        // Importa dati di vento
        if (!context.Vento.Any())
        {
            var csvPath = Path.Combine(AppContext.BaseDirectory, "Dati", "DATI_Vento.csv");

            // Se il file non esiste nella cartella di output, cerca nella cartella del progetto
            if (!File.Exists(csvPath))
            {
                var projectPath = Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "Dati", "DATI_Vento.csv");
                csvPath = Path.GetFullPath(projectPath);
            }

            if (File.Exists(csvPath))
            {
                var config = new CsvConfiguration(CultureInfo.InvariantCulture)
                {
                    Delimiter = ";",
                    HeaderValidated = null,
                    MissingFieldFound = null
                };

                using var reader = new StreamReader(csvPath);
                using var csv = new CsvReader(reader, config);

                var records = csv.GetRecords<VentoRecord>().ToList();
                context.Vento.AddRange(records);
                context.SaveChanges();
            }
        }
    }
    catch (Exception ex)
    {
        // Log errore - considera di usare un logger
        Console.WriteLine($"Errore durante l'inizializzazione del database: {ex.Message}");
    }
}

app.UseHttpsRedirection();

app.MapGet("/", () => Results.Ok("API Project Work Sirius"));

app.MapGet("/active-power-data", (TurbinaDAL energiaDAL) =>
{
    List<DatiTurbina> elenco = energiaDAL.GetAll();
    return Results.Ok(elenco);
});

app.MapGet("/windspeed-data", (VentoDAL ventoDAL) =>
{
    List<DatiVento> elenco = ventoDAL.GetAll();
    return Results.Ok(elenco);
});

app.Run();