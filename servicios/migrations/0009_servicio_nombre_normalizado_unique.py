from django.db import migrations, models
from django.db.models.functions import Lower, Trim


class Migration(migrations.Migration):

    dependencies = [
        ('servicios', '0008_delete_gestionalisado'),
    ]

    operations = [
        migrations.AddConstraint(
            model_name='servicio',
            constraint=models.UniqueConstraint(
                Lower(Trim('nombre')),
                name='servicios_nombre_normalizado_unique',
            ),
        ),
    ]
