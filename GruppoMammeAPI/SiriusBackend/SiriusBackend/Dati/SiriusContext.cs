using Microsoft.EntityFrameworkCore;
using SiriusBackend.Models;

namespace SiriusBackend.Dati
{
    public class SiriusContext : DbContext
    {
        public SiriusContext(DbContextOptions<SiriusContext> options) : base(options) { }

        public DbSet<EnergiaRecord> Energia { get; set; }
        public DbSet<VentoRecord> Vento { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configura la precisione dei valori decimal
            modelBuilder.Entity<EnergiaRecord>()
                .Property(e => e.ActivePower)
                .HasColumnType("decimal(18,4)");

            modelBuilder.Entity<VentoRecord>()
                .Property(v => v.Windspeed)
                .HasColumnType("decimal(18,4)");
        }
    }
}