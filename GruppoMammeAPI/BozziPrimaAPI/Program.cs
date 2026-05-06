using BozziPrimaAPI;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
var app = builder.Build();

// Configure the HTTP request pipeline.
app.UseHttpsRedirection();

VentoDAL ventoDAL = new VentoDAL();

// end points
app.MapGet("/", () =>
{
    return Results.Ok("API Project Work Sirius");
});

app.MapGet("/active-power-data", () =>
{
    List<Vento> elenco = ventoDAL.GetAll();

    // restituisce tutti i messaggi memorizzati
    return Results.Ok(elenco);
});


app.Run();