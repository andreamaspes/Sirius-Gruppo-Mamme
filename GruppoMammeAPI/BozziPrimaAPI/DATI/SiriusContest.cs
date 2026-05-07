using Microsoft.EntityFrameworkCore;
using BozziPrimaAPI.Models;


namespace BozziPrimaAPI.DATI
{
    public class SiriusContest
    {
        public class SiriusContestData : DbContext
        {
            public DbSet<Turbina> Turbine { get; set; }
            public DbSet<Vento> Vento { get; set; }


            protected override void OnModelCreating(ModelBuilder modelBuilder)
            {
                base.OnModelCreating(modelBuilder);

                // Configura la precisione dei valori decimal
                modelBuilder.Entity<Turbina>()
                    .Property(e => e.Power)
                    .HasColumnType("decimal(18,4)");

                modelBuilder.Entity<Vento>()
                    .Property(v => v.WindSpeed)
                    .HasColumnType("decimal(18,4)");
            }
        }
    }
}
